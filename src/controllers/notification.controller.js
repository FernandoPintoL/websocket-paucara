import notificationService from '../services/notification.service.js';
import proformaNotificationService from '../services/proforma.notification.service.js';

class NotificationController {
    // Manejar notificaciones genéricas desde Laravel
    async handleNotification(req, res) {
        try {
            // Soportar múltiples formatos para compatibilidad
            const { event, data, userId, userType, notification } = req.body;

            // Determinar el evento a enviar
            const eventName = event || req.body.event || 'notification';

            // Determinar los datos a enviar
            let notificationData = data || notification || req.body;

            console.log('\n═══════════════════════════════════════════════════════════');
            console.log('📡 NOTIFICACIÓN RECIBIDA DESDE LARAVEL');
            console.log('═══════════════════════════════════════════════════════════');
            console.log(`   Evento: ${eventName}`);
            console.log(`   Datos recibidos:`, JSON.stringify(notificationData, null, 2));
            console.log('═══════════════════════════════════════════════════════════\n');

            let notificationSent = false;

            // ✅ Manejar eventos específicos de proformas
            if (eventName === 'notify/proforma-created' || eventName === 'proforma.creada') {
                notificationSent = proformaNotificationService.notifyProformaCreated(notificationData);
            } else if (eventName === 'notify/proforma-approved' || eventName === 'proforma.aprobada') {
                notificationSent = proformaNotificationService.notifyProformaApproved(notificationData);
            } else if (eventName === 'notify/proforma-rejected' || eventName === 'proforma.rechazada') {
                notificationSent = proformaNotificationService.notifyProformaRejected(notificationData);
            } else if (eventName === 'notify/proforma-converted' || eventName === 'proforma.convertida') {
                notificationSent = proformaNotificationService.notifyProformaConverted(notificationData);
            } else if (eventName === 'notify/stock-reserved') {
                notificationSent = proformaNotificationService.notifyStockReserved(notificationData);
            } else if (eventName === 'notify/reservation-expiring') {
                notificationSent = proformaNotificationService.notifyReservationExpiring(notificationData);
            }
            // ✅ Manejar eventos específicos de entregas (acciones del chofer)
            else if (eventName === 'entrega.llegada-confirmada') {
                console.log('✅ Chofer llegó al destino');
                // Broadcast a admin, cliente y chofer
                notificationService.notifyAll('entrega:llegada-confirmada', {
                    ...notificationData,
                    tipo: 'entrega_action',
                    accion: 'chofer_llego'
                });
                notificationSent = true;
            } else if (eventName === 'entrega.confirmada') {
                console.log('✅ Entrega confirmada exitosamente');
                // Broadcast a admin, cliente y chofer
                notificationService.notifyAll('entrega:confirmada', {
                    ...notificationData,
                    tipo: 'entrega_action',
                    accion: 'entrega_confirmada'
                });
                notificationSent = true;
            } else if (eventName === 'entrega.novedad-reportada') {
                console.log('⚠️ Novedad reportada en entrega');
                // Notificar a admin y logística
                notificationService.notifyAll('entrega:novedad-reportada', {
                    ...notificationData,
                    tipo: 'entrega_action',
                    accion: 'novedad_reportada',
                    prioridad: 'high'
                });
                notificationSent = true;
            }
            // ✅ FASE 2: Manejar eventos de cambio de estado de entregas
            // Estos eventos vienen desde Laravel cuando cambia el estado
            else if (eventName === 'entrega.estado_cambio') {
                console.log('📦 Cambio de estado en entrega');
                notificationService.notifyAll('entrega:estado_cambio', {
                    ...notificationData,
                    tipo: 'entrega_estado',
                    prioridad: this.getPriorityForEntregaState(notificationData.estado_nuevo?.codigo)
                });
                notificationSent = true;
            } else if (eventName === 'entrega.en_transito') {
                console.log('📍 Entrega en tránsito - GPS activo');
                notificationService.notifyAll('entrega:en_transito', {
                    ...notificationData,
                    tipo: 'entrega_tracking',
                    prioridad: 'high'
                });
                notificationSent = true;
            } else if (eventName === 'entrega.entregada') {
                console.log('✅ Entrega completada');
                notificationService.notifyAll('entrega:entregada', {
                    ...notificationData,
                    tipo: 'entrega_estado',
                    prioridad: 'medium'
                });
                notificationSent = true;
            } else if (eventName === 'entrega.problema') {
                console.log('⚠️ Problema en entrega');
                notificationService.notifyAll('entrega:problema', {
                    ...notificationData,
                    tipo: 'entrega_estado',
                    prioridad: 'high'
                });
                notificationSent = true;
            }
            // ✅ FASE 3: Manejar eventos de ubicación GPS en tiempo real
            else if (eventName === 'entrega.ubicacion') {
                console.log('📍 Ubicación actualizada - Lat:', notificationData.latitud, 'Lng:', notificationData.longitud);
                notificationService.notifyAll('entrega:ubicacion', {
                    ...notificationData,
                    tipo: 'entrega_tracking',
                    prioridad: 'high'
                });
                notificationSent = true;
            }
            // Fallback: Notificar a un usuario específico por ID
            else if (userId || data?.user_id) {
                const targetUserId = userId || data?.user_id;
                notificationSent = notificationService.notifyUser(targetUserId, eventName, notificationData);
            }
            // Notificar a todos los usuarios de un tipo específico (cobrador, manager, etc.)
            else if (userType) {
                notificationSent = notificationService.notifyUserType(userType, eventName, notificationData);
            }
            // Broadcast a todos los usuarios
            else {
                notificationService.notifyAll(eventName, notificationData);
                notificationSent = true;
            }

            res.json({
                success: true,
                message: 'Notification sent',
                event: eventName,
                target: userId || data?.user_id
                    ? `user ${userId || data.user_id}`
                    : (userType ? `all ${userType}s` : 'all users'),
                sent: notificationSent
            });
        } catch (error) {
            console.error('Error sending notification:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // ✅ Nuevo endpoint: Obtener estadísticas de usuarios conectados
    async getConnectedStats(req, res) {
        try {
            const stats = proformaNotificationService.getConnectedStats();
            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Error getting connected stats:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // ✅ Nuevo endpoint: Verificar que el servidor WebSocket está activo
    async healthCheck(req, res) {
        res.json({
            success: true,
            message: 'WebSocket server is running',
            timestamp: new Date().toISOString()
        });
    }

    // ✅ FASE 2: Determinar prioridad de evento según estado
    // Estados críticos (GPS activo) son high priority
    // Estados finales son medium priority
    getPriorityForEntregaState(estadoCodigo) {
        const criticalStates = ['EN_TRANSITO', 'EN_CAMINO', 'LLEGO'];
        const mediumStates = ['ENTREGADO', 'ENTREGADA'];
        const lowStates = ['PROGRAMADO', 'ASIGNADA', 'CANCELADA'];

        if (criticalStates.includes(estadoCodigo)) return 'high';
        if (mediumStates.includes(estadoCodigo)) return 'medium';
        if (lowStates.includes(estadoCodigo)) return 'low';
        return 'medium'; // default
    }
}

export default new NotificationController();
