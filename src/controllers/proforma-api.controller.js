import proformaService from '../services/proforma.service.js';

/**
 * Controlador para endpoints REST que reciben notificaciones desde Laravel
 */
class ProformaApiController {

    // ========================================
    // ENDPOINTS DE PROFORMAS
    // ========================================

    /**
     * POST /notify/proforma-created
     * Notificar creación de nueva proforma
     */
    notifyCreated(req, res) {
        try {
            const proformaData = req.body;

            // Validación básica
            if (!proformaData.id || !proformaData.cliente_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de proforma inválidos',
                    errors: { id: 'Campo requerido', cliente_id: 'Campo requerido' }
                });
            }

            // Enviar notificación
            const result = proformaService.notifyProformaCreated(proformaData);

            return res.json({
                success: result,
                message: 'Notificación de creación enviada',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error en notifyCreated:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar notificación',
                error: error.message
            });
        }
    }

    /**
     * POST /notify/proforma-approved
     * Notificar aprobación de proforma
     */
    notifyApproved(req, res) {
        try {
            const proformaData = req.body;

            if (!proformaData.id || !proformaData.cliente_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos'
                });
            }

            const result = proformaService.notifyProformaApproved(proformaData);

            return res.json({
                success: result,
                message: 'Notificación de aprobación enviada',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error en notifyApproved:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar notificación',
                error: error.message
            });
        }
    }

    /**
     * POST /notify/proforma-rejected
     * Notificar rechazo de proforma
     */
    notifyRejected(req, res) {
        try {
            const proformaData = req.body;

            if (!proformaData.id || !proformaData.cliente_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos'
                });
            }

            const result = proformaService.notifyProformaRejected(proformaData);

            return res.json({
                success: result,
                message: 'Notificación de rechazo enviada',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error en notifyRejected:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar notificación',
                error: error.message
            });
        }
    }

    /**
     * POST /notify/proforma-converted
     * Notificar conversión de proforma a venta
     */
    notifyConverted(req, res) {
        try {
            const conversionData = req.body;

            if (!conversionData.proforma_id || !conversionData.cliente_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos'
                });
            }

            const result = proformaService.notifyProformaConverted(conversionData);

            return res.json({
                success: result,
                message: 'Notificación de conversión enviada',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error en notifyConverted:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar notificación',
                error: error.message
            });
        }
    }

    // ========================================
    // ENDPOINTS DE STOCK
    // ========================================

    /**
     * POST /notify/stock-updated
     * Notificar actualización de stock
     */
    notifyStockUpdated(req, res) {
        try {
            const productData = req.body;

            if (!productData.producto_id) {
                return res.status(400).json({
                    success: false,
                    message: 'producto_id requerido'
                });
            }

            const result = proformaService.notifyStockUpdated(productData);

            return res.json({
                success: result,
                message: 'Actualización de stock enviada',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error en notifyStockUpdated:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar notificación',
                error: error.message
            });
        }
    }

    /**
     * POST /notify/stock-reserved
     * Notificar reserva de stock
     */
    notifyStockReserved(req, res) {
        try {
            const reservationData = req.body;

            const result = proformaService.notifyStockReserved(reservationData);

            return res.json({
                success: result,
                message: 'Notificación de reserva enviada',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error en notifyStockReserved:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar notificación',
                error: error.message
            });
        }
    }

    /**
     * POST /notify/reservation-expiring
     * Notificar que reserva está por vencer
     */
    notifyReservationExpiring(req, res) {
        try {
            const reservationData = req.body;

            if (!reservationData.proforma_id || !reservationData.cliente_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos'
                });
            }

            const result = proformaService.notifyReservationExpiring(reservationData);

            return res.json({
                success: result,
                message: 'Alerta de vencimiento enviada',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error en notifyReservationExpiring:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar notificación',
                error: error.message
            });
        }
    }

    // ========================================
    // ENDPOINTS DE PAGOS
    // ========================================

    /**
     * POST /notify/payment-received
     * Notificar pago recibido
     */
    notifyPaymentReceived(req, res) {
        try {
            const paymentData = req.body;

            const result = proformaService.notifyPaymentReceived(paymentData);

            return res.json({
                success: result,
                message: 'Notificación de pago enviada',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error en notifyPaymentReceived:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar notificación',
                error: error.message
            });
        }
    }

    // ========================================
    // ENDPOINTS GENÉRICOS
    // ========================================

    /**
     * POST /notify/user
     * Notificar a un usuario específico
     */
    notifyUser(req, res) {
        try {
            const userData = req.body;

            if (!userData.user_id || !userData.event) {
                return res.status(400).json({
                    success: false,
                    message: 'user_id y event requeridos'
                });
            }

            const result = proformaService.notifyUser(userData);

            return res.json({
                success: result,
                message: 'Notificación enviada al usuario',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error en notifyUser:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar notificación',
                error: error.message
            });
        }
    }

    /**
     * POST /notify/role
     * Notificar a un rol/grupo
     */
    notifyRole(req, res) {
        try {
            const roleData = req.body;

            if (!roleData.role || !roleData.event) {
                return res.status(400).json({
                    success: false,
                    message: 'role y event requeridos'
                });
            }

            const result = proformaService.notifyRole(roleData);

            return res.json({
                success: result,
                message: 'Notificación enviada al rol',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error en notifyRole:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar notificación',
                error: error.message
            });
        }
    }

    /**
     * POST /notify/broadcast
     * Broadcast a todos los usuarios
     */
    broadcast(req, res) {
        try {
            const broadcastData = req.body;

            if (!broadcastData.event) {
                return res.status(400).json({
                    success: false,
                    message: 'event requerido'
                });
            }

            const result = proformaService.broadcast(broadcastData);

            return res.json({
                success: result,
                message: 'Broadcast enviado',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error en broadcast:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar notificación',
                error: error.message
            });
        }
    }
}

export default new ProformaApiController();
