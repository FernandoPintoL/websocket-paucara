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

// ✅ NUEVO: Endpoint para notificación directa al cliente cuando su proforma se convierte a venta
// POST /notify/cliente-proforma-converted
// Headers: { 'x-ws-secret': '...' }
// Body: {
//   cliente_id: int,
//   cliente_nombre: string,
//   proforma_id: int,
//   proforma_numero: string,
//   venta_id: int,
//   venta_numero: string,
//   total: float,
//   fecha_conversion: ISO8601,
//   tipo_notificacion: 'cliente'
// }
router.post('/notify/cliente-proforma-converted', ensureBackend, (req, res, next) => {
    req.body.event = 'proforma.cliente.convertida';
    notificationController.handleNotification(req, res, next);
});

// ✅ Endpoints específicos para ventas (estado logístico)
router.post('/notify/venta-estado-cambio', ensureBackend, (req, res, next) => {
    req.body.event = 'venta.estado_cambio';
    notificationController.handleNotification(req, res, next);
});

router.post('/notify/venta-en-transito', ensureBackend, (req, res, next) => {
    req.body.event = 'venta.en_transito';
    notificationController.handleNotification(req, res, next);
});

router.post('/notify/venta-entregada', ensureBackend, (req, res, next) => {
    req.body.event = 'venta.entregada';
    notificationController.handleNotification(req, res, next);
});

router.post('/notify/venta-problema', ensureBackend, (req, res, next) => {
    req.body.event = 'venta.problema';
    notificationController.handleNotification(req, res, next);
});

// ✅ FASE 2: Endpoints específicos para entregas (cambio de estado)
// POST /notify/entrega-estado-cambio
// Headers: { 'x-ws-secret': '...' }
// Body: {
//   entrega_id: int,
//   numero_entrega: string,
//   estado_anterior: { id, codigo, nombre, color, icono },
//   estado_nuevo: { id, codigo, nombre, color, icono },
//   razon: string,
//   timestamp: ISO8601
// }
router.post('/notify/entrega-estado-cambio', ensureBackend, (req, res, next) => {
    req.body.event = 'entrega.estado_cambio';
    notificationController.handleNotification(req, res, next);
});

router.post('/notify/entrega-en-transito', ensureBackend, (req, res, next) => {
    req.body.event = 'entrega.en_transito';
    notificationController.handleNotification(req, res, next);
});

router.post('/notify/entrega-entregada', ensureBackend, (req, res, next) => {
    req.body.event = 'entrega.entregada';
    notificationController.handleNotification(req, res, next);
});

router.post('/notify/entrega-problema', ensureBackend, (req, res, next) => {
    req.body.event = 'entrega.problema';
    notificationController.handleNotification(req, res, next);
});

// ✅ FASE 3: Endpoint para ubicación GPS en tiempo real
// POST /notify/entrega-ubicacion
// Headers: { 'x-ws-secret': '...' }
// Body: {
//   entrega_id: int,
//   latitud: float,
//   longitud: float,
//   velocidad: float,
//   rumbo: float,
//   altitud: float,
//   precision: float,
//   timestamp: ISO8601,
//   chofer_nombre: string
// }
router.post('/notify/entrega-ubicacion', ensureBackend, (req, res, next) => {
    req.body.event = 'entrega.ubicacion';
    notificationController.handleNotification(req, res, next);
});

// ✅ FASE 4: Endpoint para asignación de entrega consolidada al chofer
// POST /notify/entrega-asignada
// Headers: { 'x-ws-secret': '...' }
// Body: {
//   entrega_id: int,
//   numero_entrega: string,
//   chofer_id: int,
//   chofer: { id, nombre, name },
//   vehiculo: { id, placa, marca, modelo },
//   peso_kg: float,
//   volumen_m3: float,
//   estado: string,
//   fecha_asignacion: ISO8601,
//   mensaje: string,
//   timestamp: ISO8601
// }
router.post('/notify/entrega-asignada', ensureBackend, (req, res, next) => {
    req.body.event = 'notify/entrega-asignada';
    notificationController.handleNotification(req, res, next);
});

// ✅ CREDITOS: Endpoints específicos para eventos de crédito
router.post('/notify/credito-creado', ensureBackend, (req, res, next) => {
    req.body.event = 'credito.creado';
    notificationController.handleNotification(req, res, next);
});

router.post('/notify/credito-aprobado', ensureBackend, (req, res, next) => {
    req.body.event = 'credito.aprobado';
    notificationController.handleNotification(req, res, next);
});

router.post('/notify/credito-rechazado', ensureBackend, (req, res, next) => {
    req.body.event = 'credito.rechazado';
    notificationController.handleNotification(req, res, next);
});

router.post('/notify/credito-pago-registrado', ensureBackend, (req, res, next) => {
    req.body.event = 'credito.pago_registrado';
    notificationController.handleNotification(req, res, next);
});

router.post('/notify/credito-vencido', ensureBackend, (req, res, next) => {
    req.body.event = 'credito.vencido';
    notificationController.handleNotification(req, res, next);
});

router.post('/notify/credito-critico', ensureBackend, (req, res, next) => {
    req.body.event = 'credito.critico';
    notificationController.handleNotification(req, res, next);
});

router.post('/notify/credito-limite-actualizado', ensureBackend, (req, res, next) => {
    req.body.event = 'credito.limite_actualizado';
    notificationController.handleNotification(req, res, next);
});

// ✅ NUEVOS: Endpoints para confirmación de venta entregada (individual)
// POST /notify/venta-entregada-cliente
// Headers: { 'x-ws-secret': '...' }
// Body: {
//   venta_id: int,
//   venta_numero: string,
//   user_id: int (cliente.user_id),
//   cliente_nombre: string,
//   entrega_id: int,
//   numero_entrega: string,
//   mensaje: string
// }
router.post('/notify/venta-entregada-cliente', ensureBackend, (req, res, next) => {
    req.body.event = 'notify/venta-entregada-cliente';
    notificationController.handleNotification(req, res, next);
});

// POST /notify/venta-entregada-admin
// Headers: { 'x-ws-secret': '...' }
// Body: {
//   venta_id: int,
//   venta_numero: string,
//   cliente_nombre: string,
//   cliente_id: int,
//   entrega_id: int,
//   numero_entrega: string,
//   chofer: { id, nombre },
//   mensaje: string
// }
router.post('/notify/venta-entregada-admin', ensureBackend, (req, res, next) => {
    req.body.event = 'notify/venta-entregada-admin';
    notificationController.handleNotification(req, res, next);
});

// POST /notify/entrega-finalizada-admin
// Headers: { 'x-ws-secret': '...' }
// Body: {
//   entrega_id: int,
//   numero_entrega: string,
//   cantidad_ventas: int,
//   clientes_unicos: int,
//   clientes_nombres: string,
//   chofer: { id, nombre },
//   vehiculo: { id, placa, marca, modelo },
//   fecha_entrega: ISO8601,
//   mensaje: string
// }
router.post('/notify/entrega-finalizada-admin', ensureBackend, (req, res, next) => {
    req.body.event = 'notify/entrega-finalizada-admin';
    notificationController.handleNotification(req, res, next);
});

export default router;
