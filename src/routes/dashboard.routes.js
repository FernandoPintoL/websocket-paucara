import express from 'express';
import DashboardApiController from '../controllers/dashboard-api.controller.js';
import { ensureBackend } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Dashboard Broadcasting Routes
 *
 * Estas rutas reciben actualizaciones desde Laravel y las transmiten a través de WebSocket
 */

// POST /notify/dashboard-metrics
// Recibe actualizaciones de métricas del dashboard desde Laravel
router.post('/dashboard-metrics', ensureBackend, DashboardApiController.notifyMetricsUpdated);

// POST /notify/dashboard-stock-alert
// Recibe alertas de stock bajo/crítico desde Laravel
router.post('/dashboard-stock-alert', ensureBackend, DashboardApiController.notifyStockAlert);

export default router;
