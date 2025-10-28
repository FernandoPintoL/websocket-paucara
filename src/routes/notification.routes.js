import express from 'express';
import notificationController from '../controllers/notification.controller.js';
import { ensureBackend } from '../middleware/auth.middleware.js';

const router = express.Router();

// API endpoint para notificaciones externas (Laravel)
router.post('/notify', ensureBackend, notificationController.handleNotification);

export default router;
