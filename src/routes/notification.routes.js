import express from 'express';
import notificationController from '../controllers/notification.controller.js';
import { ensureBackend } from '../middleware/auth.middleware.js';

const router = express.Router();

// ✅ API endpoint para notificaciones externas (Laravel)
// POST /notify
// Headers: { 'x-ws-secret': '...' }
// Body: { event, data, userId?, userType? }
router.post('/notify', ensureBackend, notificationController.handleNotification);

// ✅ Obtener estadísticas de usuarios conectados
// GET /api/connected-stats
router.get('/api/connected-stats', notificationController.getConnectedStats);

// ✅ Health check del servidor WebSocket
// GET /health
router.get('/health', notificationController.healthCheck);

// ✅ Endpoints específicos para proformas (para compatibilidad con diferentes formatos)
router.post('/notify/proforma-created', ensureBackend, (req, res, next) => {
    req.body.event = 'proforma.creada';
    notificationController.handleNotification(req, res, next);
});

router.post('/notify/proforma-approved', ensureBackend, (req, res, next) => {
    req.body.event = 'proforma.aprobada';
    notificationController.handleNotification(req, res, next);
});

router.post('/notify/proforma-rejected', ensureBackend, (req, res, next) => {
    req.body.event = 'proforma.rechazada';
    notificationController.handleNotification(req, res, next);
});

router.post('/notify/proforma-converted', ensureBackend, (req, res, next) => {
    req.body.event = 'proforma.convertida';
    notificationController.handleNotification(req, res, next);
});

export default router;
