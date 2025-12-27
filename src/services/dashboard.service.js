import socketRepository from '../repositories/socket.repository.js';

/**
 * Dashboard Service
 *
 * Maneja la lógica de broadcasting de eventos del dashboard a través de WebSocket
 * Distribuye mensajes a las salas (rooms) apropiadas según el tipo de usuario
 */
class DashboardService {
    /**
     * Notificar actualizaciones de métricas del dashboard
     *
     * @param {Object} data - { metricas, periodo, timestamp }
     */
    static async notifyMetricsUpdated(data) {
        try {
            // Broadcast a managers y admins
            socketRepository.emitToRoom('managers', 'dashboard.metrics-updated', data);
            socketRepository.emitToRoom('admins', 'dashboard.metrics-updated', data);

            console.log(`📊 [Dashboard Service] Métricas actualizadas (período: ${data.periodo})`);
            console.log(`   Timestamp: ${data.timestamp}`);
            console.log(`   Broadcasted to: managers, admins`);

            return {
                success: true,
                message: 'Metrics updated successfully',
                periodo: data.periodo,
                timestamp: data.timestamp
            };
        } catch (error) {
            console.error('❌ Error notifying metrics:', error.message);
            throw error;
        }
    }

    /**
     * Notificar alertas de stock bajo/crítico
     *
     * @param {Object} data - { stock_bajo, stock_critico, productos_afectados, timestamp }
     */
    static async notifyStockAlert(data) {
        try {
            // Alertas críticas a todos los roles relevantes
            socketRepository.emitToRoom('managers', 'dashboard.stock-alert', data);
            socketRepository.emitToRoom('admins', 'dashboard.stock-alert', data);
            socketRepository.emitToRoom('preventistas', 'dashboard.stock-alert', data);

            const stockBajoCount = data.stock_bajo ? data.stock_bajo.length : 0;
            const stockCriticoCount = data.stock_critico ? data.stock_critico.length : 0;
            const totalAfectados = data.productos_afectados || (stockBajoCount + stockCriticoCount);

            console.log(`⚠️ [Dashboard Service] Stock Alert`);
            console.log(`   Stock bajo: ${stockBajoCount} productos`);
            console.log(`   Stock crítico: ${stockCriticoCount} productos`);
            console.log(`   Total afectados: ${totalAfectados}`);
            console.log(`   Broadcasted to: managers, admins, preventistas`);

            return {
                success: true,
                message: 'Stock alert sent successfully',
                stock_bajo_count: stockBajoCount,
                stock_critico_count: stockCriticoCount,
                total_afectados: totalAfectados
            };
        } catch (error) {
            console.error('❌ Error notifying stock alert:', error.message);
            throw error;
        }
    }
}

export default DashboardService;
