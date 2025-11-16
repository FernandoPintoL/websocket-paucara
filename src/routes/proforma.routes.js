import express from 'express';
import proformaApiController from '../controllers/proforma-api.controller.js';
import { ensureBackend } from '../middleware/auth.middleware.js';

const router = express.Router();

// ========================================
// RUTAS DE NOTIFICACIONES DE PROFORMAS
// ========================================

// Llamadas desde Laravel cuando ocurren eventos de proformas
router.post('/notify/proforma-created', ensureBackend, (req, res) => proformaApiController.notifyCreated(req, res));
router.post('/notify/proforma-approved', ensureBackend, (req, res) => proformaApiController.notifyApproved(req, res));
router.post('/notify/proforma-rejected', ensureBackend, (req, res) => proformaApiController.notifyRejected(req, res));
router.post('/notify/proforma-converted', ensureBackend, (req, res) => proformaApiController.notifyConverted(req, res));

// ========================================
// RUTAS DE NOTIFICACIONES DE STOCK
// ========================================

router.post('/notify/stock-updated', (req, res) => proformaApiController.notifyStockUpdated(req, res));
router.post('/notify/stock-reserved', (req, res) => proformaApiController.notifyStockReserved(req, res));
router.post('/notify/reservation-expiring', (req, res) => proformaApiController.notifyReservationExpiring(req, res));

// ========================================
// RUTAS DE NOTIFICACIONES DE PAGOS
// ========================================

router.post('/notify/payment-received', (req, res) => proformaApiController.notifyPaymentReceived(req, res));

// ========================================
// RUTAS GENÉRICAS DE NOTIFICACIONES
// ========================================

router.post('/notify/user', (req, res) => proformaApiController.notifyUser(req, res));
router.post('/notify/role', (req, res) => proformaApiController.notifyRole(req, res));
router.post('/notify/broadcast', (req, res) => proformaApiController.broadcast(req, res));

export default router;
