import notificationRoutes from './notification.routes.js';
import healthRoutes from './health.routes.js';
import usersRoutes from './users.routes.js';
import proformaRoutes from './proforma.routes.js';

export const setupRoutes = (app) => {
    // Rutas de salud y estáticas
    app.use('/', healthRoutes);

    // Rutas de notificaciones (legacy)
    app.use('/', notificationRoutes);

    // Rutas de proformas (Laravel → WebSocket)
    app.use('/', proformaRoutes);

    // Rutas de usuarios conectados
    app.use('/api/users', usersRoutes);
};
