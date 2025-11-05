import activeUsersRepository from '../repositories/activeUsers.repository.js';
import socketRepository from '../repositories/socket.repository.js';
import sanctumAuthMiddleware from '../middleware/sanctum-auth.middleware.js';

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
    async authenticateUser(socket, userData) {
        try {
            // PASO 1: Validar token Sanctum o datos legacy
            const validationResult = await sanctumAuthMiddleware.verifyToken(socket, userData);

            if (!validationResult.success) {
                return {
                    success: false,
                    message: validationResult.message,
                    code: validationResult.code || 'AUTH_FAILED'
                };
            }

            // PASO 2: Extraer datos validados
            const {
                userId,
                userName,
                userType,
                userEmail,
                roles,
                tokenValidated,
                source
            } = validationResult;

            // Normalizar userId a string
            const normalizedUserId = String(userId);

            // Obtener IP del cliente
            const clientIP = this.getClientIP(socket);

            // PASO 3: Almacenar información del usuario
            activeUsersRepository.addUser(socket.id, {
                userId: normalizedUserId,
                userType,
                userName,
                userEmail,
                roles,
                clientIP,
                tokenValidated,
                source,
                connectedAt: new Date().toISOString()
            });

            // PASO 4: Unir al usuario a salas según su tipo
            this.joinUserToRooms(socket, userType);

            // PASO 5: Unir a sala personal
            socketRepository.joinRoom(socket, `user_${normalizedUserId}`);

            // PASO 6: Log de autenticación
            const authMethod = tokenValidated ? 'Token Sanctum' : 'Legacy';
            console.log(`\n✅ Usuario autenticado (${authMethod}):`);
            console.log(`   Nombre: ${userName}`);
            console.log(`   Email: ${userEmail || 'N/A'}`);
            console.log(`   Tipo: ${userType}`);
            console.log(`   Roles: ${roles?.join(', ') || 'N/A'}`);
            console.log(`   ID Usuario: ${normalizedUserId}`);
            console.log(`   IP: ${clientIP}`);
            console.log(`   Socket ID: ${socket.id}`);

            // PASO 7: Notificar a otros usuarios sobre la conexión
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
                userName,
                userType,
                userEmail,
                roles,
                clientIP,
                tokenValidated,
                authMethod
            };
        } catch (error) {
            console.error('Error en autenticación:', error);
            return {
                success: false,
                message: 'Error en autenticación del usuario',
                code: 'AUTH_ERROR'
            };
        }
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
