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
}

export default new NotificationController();
