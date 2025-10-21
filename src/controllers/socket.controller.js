import authService from '../services/auth.service.js';
import socketRepository from '../repositories/socket.repository.js';
import activeUsersRepository from '../repositories/activeUsers.repository.js';

class SocketController {
    // Obtener IP real del cliente
    getClientIP(socket) {
        // Intentar obtener IP de headers si está detrás de proxy
        const forwarded = socket.handshake.headers['x-forwarded-for'];
        if (forwarded) {
            // x-forwarded-for puede contener múltiples IPs separadas por coma
            return forwarded.split(',')[0].trim();
        }

        // Obtener IP directa del socket
        const address = socket.handshake.address;
        // Convertir IPv6 localhost a IPv4
        if (address === '::1' || address === '::ffff:127.0.0.1') {
            return '127.0.0.1';
        }
        // Remover prefijo IPv6 si existe
        return address.replace('::ffff:', '');
    }

    // Manejar conexión de socket
    handleConnection(socket) {
        const clientIP = this.getClientIP(socket);
        console.log(`\n🔌 Nueva conexión:`);
        console.log(`   Socket ID: ${socket.id}`);
        console.log(`   IP Cliente: ${clientIP}`);
        console.log(`   User-Agent: ${socket.handshake.headers['user-agent'] || 'N/A'}`);

        // Evento de autenticación del usuario
        socket.on('authenticate', (data) => {
            const result = authService.authenticateUser(socket, data);

            if (result.success) {
                socket.emit('authenticated', result);
            } else {
                socket.emit('authentication_error', result);
            }
        });

        // Evento de ciclo de vida de crédito
        socket.on('credit_lifecycle', (data) => {
            this.handleCreditLifecycle(socket, data);
        });

        // Evento de notificación de crédito (compatibilidad)
        socket.on('credit_notification', (data) => {
            this.handleCreditNotificationSocket(socket, data);
        });

        // Evento de actualización de pago
        socket.on('payment_update', (data) => {
            this.handlePaymentUpdate(socket, data);
        });

        // Evento de notificación de ruta
        socket.on('route_notification', (data) => {
            this.handleRouteNotification(socket, data);
        });

        // Evento de enviar mensaje
        socket.on('send_message', (data) => {
            this.handleSendMessage(socket, data);
        });

        // Evento de actualización de ubicación
        socket.on('location_update', (data) => {
            this.handleLocationUpdate(socket, data);
        });

        // Evento de desconexión
        socket.on('disconnect', () => {
            this.handleDisconnect(socket);
        });

        // Manejar errores
        socket.on('error', (error) => {
            console.error('Error en socket:', error);
        });
    }

    // Manejar ciclo de vida de crédito
    handleCreditLifecycle(socket, data) {
        const { action, creditId, targetUserId, credit, userType, message } = data;
        const user = activeUsersRepository.getUserBySocketId(socket.id);

        console.log(`🏦 Credit lifecycle event: ${action}`, {
            creditId,
            from: user?.userName,
            targetUserId
        });

        const notificationData = {
            action: action,
            creditId: creditId,
            credit: credit,
            message: message,
            timestamp: new Date().toISOString(),
            from: user ? { id: user.userId, name: user.userName, type: user.userType } : null
        };

        // Enviar a usuario específico si corresponde
        if (targetUserId) {
            socketRepository.emitToUser(targetUserId, 'credit_lifecycle_update', notificationData);
            console.log(`📨 Credit lifecycle sent to user ${targetUserId}`);
        }

        // Enviar a grupos según el tipo de acción
        switch (action) {
            case 'created':
                socketRepository.emitToRoom('managers', 'credit_pending_approval', notificationData);
                break;
            case 'approved':
            case 'rejected':
                socketRepository.emitToRoom('cobradores', 'credit_decision', notificationData);
                if (targetUserId) {
                    socketRepository.emitToUser(targetUserId, 'credit_decision', notificationData);
                }
                break;
            case 'delivered':
                socketRepository.emitToRoom('managers', 'credit_delivered_notification', notificationData);
                break;
            case 'requires_attention':
                if (targetUserId) {
                    socketRepository.emitToUser(targetUserId, 'credit_attention_required', notificationData);
                } else {
                    socketRepository.emitToRoom('cobradores', 'credit_attention_required', notificationData);
                }
                break;
        }
    }

    // Manejar notificación de crédito desde socket
    handleCreditNotificationSocket(socket, data) {
        const { targetUserId, notification, userType } = data;
        const user = activeUsersRepository.getUserBySocketId(socket.id);

        const payload = {
            ...notification,
            from: user ? { id: user.userId, name: user.userName, type: user.userType } : null,
            timestamp: new Date().toISOString(),
        };

        if (targetUserId) {
            socketRepository.emitToUser(targetUserId, 'new_credit_notification', payload);
            console.log(`📨 credit_notification reenviado a user_${targetUserId}`);
        } else if (userType) {
            socketRepository.emitToRoom(`${userType}s`, 'new_credit_notification', payload);
            console.log(`📨 credit_notification reenviado a grupo ${userType}s`);
        } else {
            socketRepository.emitToAll('new_credit_notification', payload);
            console.log(`📨 credit_notification broadcast`);
        }
    }

    // Manejar actualización de pago
    handlePaymentUpdate(socket, data) {
        const { payment, cobradorId, clientId } = data || {};
        const user = activeUsersRepository.getUserBySocketId(socket.id);

        const payload = {
            type: 'payment_update',
            payment: payment,
            cobradorId: cobradorId || user?.userId,
            clientId: clientId,
            from: user ? { id: user.userId, name: user.userName, type: user.userType } : null,
            timestamp: new Date().toISOString(),
        };

        // Notificar al cobrador mismo y a los managers
        if (payload.cobradorId) {
            socketRepository.emitToUser(payload.cobradorId, 'payment_received', payload);
        }
        socketRepository.emitToRoom('managers', 'cobrador_payment_received', payload);
        console.log(`💰 payment_update reenviado (cobrador ${payload.cobradorId ?? 'N/A'})`);
    }

    // Manejar notificación de ruta
    handleRouteNotification(socket, data) {
        const payload = {
            ...data,
            timestamp: new Date().toISOString(),
        };
        socketRepository.emitToRoom('managers', 'route_updated', payload);
        socket.emit('route_updated', payload);
        console.log('🛣️ route_notification reenviado');
    }

    // Manejar envío de mensaje
    handleSendMessage(socket, data) {
        const { recipientId, message, senderId } = data;

        socketRepository.emitToUser(recipientId, 'new_message', {
            senderId,
            message,
            timestamp: new Date()
        });

        console.log(`Mensaje enviado de ${senderId} a ${recipientId}`);
    }

    // Manejar actualización de ubicación
    handleLocationUpdate(socket, data) {
        const user = activeUsersRepository.getUserBySocketId(socket.id);

        if (user && user.userType === 'cobrador') {
            const { latitude, longitude } = data;

            socketRepository.emitToRoom('admins', 'cobrador_location_update', {
                cobradorId: user.userId,
                cobradorName: user.userName,
                latitude,
                longitude,
                timestamp: new Date()
            });

            console.log(`Ubicación actualizada para cobrador ${user.userName}`);
        }
    }

    // Manejar desconexión
    handleDisconnect(socket) {
        const userData = authService.handleDisconnect(socket.id);

        if (userData) {
            socketRepository.broadcast(socket, 'user_disconnected', userData);
        }
    }
}

export default new SocketController();
