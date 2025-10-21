import activeUsersRepository from '../repositories/activeUsers.repository.js';
import socketRepository from '../repositories/socket.repository.js';

class AuthService {
    // Obtener IP del cliente
    getClientIP(socket) {
        const forwarded = socket.handshake.headers['x-forwarded-for'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        const address = socket.handshake.address;
        if (address === '::1' || address === '::ffff:127.0.0.1') {
            return '127.0.0.1';
        }
        return address.replace('::ffff:', '');
    }

    // Autenticar usuario y unirlo a salas correspondientes
    authenticateUser(socket, userData) {
        const { userId, userType, userName } = userData;

        if (!userId) {
            return {
                success: false,
                message: 'Datos de autenticación inválidos'
            };
        }

        // Normalizar userId a string para consistencia
        const normalizedUserId = String(userId);

        // Obtener IP del cliente
        const clientIP = this.getClientIP(socket);

        // Almacenar información del usuario
        activeUsersRepository.addUser(socket.id, {
            userId: normalizedUserId,
            userType,
            userName,
            clientIP,
            connectedAt: new Date().toISOString()
        });

        // Unir al usuario a salas según su tipo
        this.joinUserToRooms(socket, userType);

        // Unir a sala personal
        socketRepository.joinRoom(socket, `user_${normalizedUserId}`);

        console.log(`\n✅ Usuario autenticado:`);
        console.log(`   Nombre: ${userName}`);
        console.log(`   Tipo: ${userType}`);
        console.log(`   ID Usuario: ${normalizedUserId} (tipo: ${typeof normalizedUserId})`);
        console.log(`   IP: ${clientIP}`);
        console.log(`   Socket ID: ${socket.id}`);

        // Notificar a otros usuarios sobre la conexión
        socketRepository.broadcast(socket, 'user_connected', {
            userId: normalizedUserId,
            userName,
            userType,
            clientIP,
            connectedAt: new Date().toISOString()
        });

        return {
            success: true,
            message: 'Autenticación exitosa',
            userId: normalizedUserId,
            userType,
            clientIP
        };
    }

    // Unir usuario a salas según su tipo
    joinUserToRooms(socket, userType) {
        switch (userType) {
            case 'cobrador':
                socketRepository.joinRoom(socket, 'cobradores');
                break;
            case 'client':
                socketRepository.joinRoom(socket, 'clients');
                break;
            case 'manager':
                socketRepository.joinRoom(socket, 'managers');
                socketRepository.joinRoom(socket, 'admins'); // Los managers también reciben notificaciones de admin
                break;
            case 'admin':
                socketRepository.joinRoom(socket, 'admins');
                socketRepository.joinRoom(socket, 'managers'); // Los admins también reciben notificaciones de managers
                socketRepository.joinRoom(socket, 'cobradores'); // Los admins también reciben notificaciones de cobradores
                break;
        }
    }

    // Manejar desconexión de usuario
    handleDisconnect(socketId) {
        const user = activeUsersRepository.removeUser(socketId);

        if (user) {
            console.log(`\n❌ Usuario desconectado:`);
            console.log(`   Nombre: ${user.userName}`);
            console.log(`   Tipo: ${user.userType}`);
            console.log(`   IP: ${user.clientIP || 'N/A'}`);
            console.log(`   Socket ID: ${socketId}`);

            return {
                userId: user.userId,
                userName: user.userName,
                userType: user.userType,
                clientIP: user.clientIP
            };
        } else {
            console.log(`\n❌ Cliente desconectado: ${socketId}`);
            return null;
        }
    }
}

export default new AuthService();
