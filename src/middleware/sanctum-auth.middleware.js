import sanctumTokenService from '../services/sanctum-token.service.js';

/**
 * Middleware para validar tokens Sanctum antes de autenticar en WebSocket
 * Se ejecuta cuando el cliente intenta conectarse con un token
 */
class SanctumAuthMiddleware {
    /**
     * Verificar token Sanctum durante handshake
     * Uso: socket.on('authenticate', this.verifyToken.bind(this))
     */
    async verifyToken(socket, data) {
        const { token, userId, userType, userName } = data;

        // OPCIÓN 1: Validación con token Sanctum (RECOMENDADO)
        if (token) {
            return await this.validateSanctumToken(socket, token);
        }

        // OPCIÓN 2: Validación legacy sin token (para compatibilidad)
        if (userId) {
            return this.validateLegacy(socket, { userId, userType, userName });
        }

        return {
            success: false,
            message: 'Token o userId requerido',
            code: 'MISSING_AUTH'
        };
    }

    /**
     * Validar token Sanctum contra la BD de Laravel
     * @param {Object} socket - Socket.IO socket
     * @param {string} token - Token Sanctum
     * @returns {Promise<Object>} Resultado de validación
     */
    async validateSanctumToken(socket, token) {
        try {
            // Validar el token contra la BD
            const validation = await sanctumTokenService.validateToken(token);

            if (!validation.valid) {
                return {
                    success: false,
                    message: validation.message,
                    code: validation.code
                };
            }

            // Token válido, retornar datos del usuario
            return {
                success: true,
                userId: validation.userId,
                userName: validation.userName,
                userType: validation.userType,
                userEmail: validation.userEmail,
                roles: validation.roles,
                tokenValidated: true,
                source: 'sanctum'
            };
        } catch (error) {
            console.error('Error en validación de token Sanctum:', error);
            return {
                success: false,
                message: 'Error en validación del token',
                code: 'VALIDATION_ERROR'
            };
        }
    }

    /**
     * Validación legacy sin token (para clientes existentes)
     * NOTA: Menos seguro, solo para compatibilidad
     * @param {Object} socket - Socket.IO socket
     * @param {Object} data - Datos de usuario (userId, userType, userName)
     * @returns {Object} Resultado de validación
     */
    validateLegacy(socket, data) {
        const { userId, userType, userName } = data;

        // Validar que userId sea válido
        if (!userId) {
            return {
                success: false,
                message: 'userId requerido',
                code: 'MISSING_USERID'
            };
        }

        // Validar que userType sea válido
        const validTypes = ['cobrador', 'client', 'manager', 'admin', 'chofer'];
        if (!userType || !validTypes.includes(userType)) {
            return {
                success: false,
                message: `userType inválido. Debe ser uno de: ${validTypes.join(', ')}`,
                code: 'INVALID_USERTYPE'
            };
        }

        // Legacy validation exitoso
        console.warn(`⚠️  Autenticación legacy (sin token) para usuario ${userId}. Se recomienda usar token Sanctum.`);

        return {
            success: true,
            userId: String(userId),
            userName: userName || `Usuario ${userId}`,
            userType: userType,
            tokenValidated: false,
            source: 'legacy'
        };
    }

    /**
     * Validar que el usuario tenga un rol específico
     * @param {string} userType - Tipo de usuario
     * @param {Array<string>} requiredRoles - Roles requeridos
     * @returns {boolean} True si el usuario tiene alguno de los roles
     */
    hasRole(userType, requiredRoles) {
        return requiredRoles.includes(userType);
    }

    /**
     * Validar que el usuario tenga permiso para una acción
     * @param {Array<string>} userAbilities - Habilidades del token
     * @param {string} action - Acción a validar
     * @returns {boolean} True si tiene permiso
     */
    hasAbility(userAbilities = [], action) {
        return userAbilities.includes(action) || userAbilities.includes('*');
    }
}

export default new SanctumAuthMiddleware();
