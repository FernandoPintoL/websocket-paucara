import socketRepository from '../repositories/socket.repository.js';

class ProformaService {

    // ========================================
    // NOTIFICACIONES DE PROFORMAS
    // ========================================

    /**
     * Notificar creación de proforma
     */
    notifyProformaCreated(proformaData) {
        const { id, numero, cliente_id, cliente, total, items, fecha_creacion, fecha_vencimiento } = proformaData;

        console.log(`📦 Nueva proforma creada: ${numero} - Cliente ${cliente_id}`);

        // 1. Notificar al cliente que creó la proforma
        socketRepository.emitToUser(cliente_id, 'proforma_created_confirmation', {
            proforma_id: id,
            numero: numero,
            total: total,
            items_count: items?.length || 0,
            fecha_creacion: fecha_creacion,
            fecha_vencimiento: fecha_vencimiento,
            message: '✅ Tu pedido ha sido recibido y está en revisión',
            type: 'success',
            timestamp: new Date().toISOString()
        });

        // 2. Notificar a todo el staff/managers sobre nueva proforma pendiente
        socketRepository.emitToRoom('managers', 'new_proforma_pending', {
            proforma_id: id,
            numero: numero,
            cliente: cliente,
            cliente_id: cliente_id,
            total: total,
            items_count: items?.length || 0,
            items: items,
            fecha_creacion: fecha_creacion,
            message: `Nueva proforma ${numero} pendiente de aprobación`,
            type: 'info',
            timestamp: new Date().toISOString()
        });

        console.log(`✅ Notificaciones enviadas: cliente ${cliente_id} + managers`);
        return true;
    }

    /**
     * Notificar aprobación de proforma
     */
    notifyProformaApproved(proformaData) {
        const { id, numero, cliente_id, usuario_aprobador, comentarios, fecha_aprobacion, total } = proformaData;

        console.log(`✅ Proforma APROBADA: ${numero} por ${usuario_aprobador?.name}`);

        // 1. Notificar al cliente
        socketRepository.emitToUser(cliente_id, 'proforma_approved', {
            proforma_id: id,
            numero: numero,
            total: total,
            approved_by: usuario_aprobador?.name,
            comments: comentarios,
            fecha_aprobacion: fecha_aprobacion,
            message: '🎉 ¡Tu pedido ha sido aprobado! Procederemos con la preparación.',
            type: 'success',
            action_required: false,
            timestamp: new Date().toISOString()
        });

        // 2. Notificar a managers (para tracking)
        socketRepository.emitToRoom('managers', 'proforma_approval_completed', {
            proforma_id: id,
            numero: numero,
            cliente_id: cliente_id,
            approved_by: usuario_aprobador,
            fecha_aprobacion: fecha_aprobacion,
            timestamp: new Date().toISOString()
        });

        console.log(`✅ Cliente ${cliente_id} notificado de aprobación`);
        return true;
    }

    /**
     * Notificar rechazo de proforma
     */
    notifyProformaRejected(proformaData) {
        const { id, numero, cliente_id, usuario_rechazador, motivo_rechazo, fecha_rechazo } = proformaData;

        console.log(`❌ Proforma RECHAZADA: ${numero} - Motivo: ${motivo_rechazo}`);

        // 1. Notificar al cliente
        socketRepository.emitToUser(cliente_id, 'proforma_rejected', {
            proforma_id: id,
            numero: numero,
            rejected_by: usuario_rechazador?.name,
            reason: motivo_rechazo,
            fecha_rechazo: fecha_rechazo,
            message: `❌ Tu pedido ${numero} ha sido rechazado`,
            type: 'error',
            action_required: true,
            timestamp: new Date().toISOString()
        });

        // 2. Notificar a managers
        socketRepository.emitToRoom('managers', 'proforma_rejection_completed', {
            proforma_id: id,
            numero: numero,
            cliente_id: cliente_id,
            rejected_by: usuario_rechazador,
            reason: motivo_rechazo,
            timestamp: new Date().toISOString()
        });

        console.log(`✅ Cliente ${cliente_id} notificado de rechazo`);
        return true;
    }

    /**
     * Notificar conversión de proforma a venta
     */
    notifyProformaConverted(conversionData) {
        const { proforma_id, proforma_numero, venta_id, venta_numero, cliente_id, total, fecha_conversion } = conversionData;

        console.log(`🔄 Proforma ${proforma_numero} convertida a venta ${venta_numero}`);

        // Notificar al cliente
        socketRepository.emitToUser(cliente_id, 'proforma_converted_to_sale', {
            proforma_id: proforma_id,
            proforma_numero: proforma_numero,
            venta_id: venta_id,
            venta_numero: venta_numero,
            total: total,
            fecha_conversion: fecha_conversion,
            message: `✅ Tu pedido ${proforma_numero} ha sido procesado como venta ${venta_numero}`,
            type: 'success',
            timestamp: new Date().toISOString()
        });

        return true;
    }

    // ========================================
    // NOTIFICACIONES DE STOCK
    // ========================================

    /**
     * Notificar actualización de stock
     */
    notifyStockUpdated(productData) {
        const { producto_id, nombre, sku, stock_anterior, stock_nuevo, disponible } = productData;

        console.log(`📦 Stock actualizado: ${nombre} (${stock_anterior} → ${stock_nuevo})`);

        // Broadcast a todos los clientes conectados
        socketRepository.emitToAll('product_stock_updated', {
            producto_id: producto_id,
            nombre: nombre,
            sku: sku,
            stock_anterior: stock_anterior,
            stock_nuevo: stock_nuevo,
            disponible: disponible,
            timestamp: new Date().toISOString()
        });

        return true;
    }

    /**
     * Notificar reserva de stock
     */
    notifyStockReserved(reservationData) {
        const { proforma_id, proforma_numero, cliente_id, items, fecha_reserva } = reservationData;

        console.log(`🔒 Stock reservado para proforma ${proforma_numero}`);

        // Notificar al cliente
        socketRepository.emitToUser(cliente_id, 'stock_reserved', {
            proforma_id: proforma_id,
            proforma_numero: proforma_numero,
            items: items,
            fecha_reserva: fecha_reserva,
            message: 'Stock reservado por 24 horas',
            type: 'info',
            timestamp: new Date().toISOString()
        });

        return true;
    }

    /**
     * Notificar que reserva está por vencer
     */
    notifyReservationExpiring(reservationData) {
        const { proforma_id, proforma_numero, cliente_id, expires_at, minutes_remaining } = reservationData;

        console.log(`⏰ Reserva por vencer: Proforma ${proforma_numero} - ${minutes_remaining} min restantes`);

        // Notificar al cliente con urgencia
        socketRepository.emitToUser(cliente_id, 'stock_reservation_expiring', {
            proforma_id: proforma_id,
            proforma_numero: proforma_numero,
            expires_at: expires_at,
            minutes_remaining: minutes_remaining,
            message: `⚠️ Tu reserva de stock expira en ${minutes_remaining} minutos`,
            type: 'warning',
            action_required: true,
            timestamp: new Date().toISOString()
        });

        return true;
    }

    // ========================================
    // NOTIFICACIONES DE PAGOS
    // ========================================

    /**
     * Notificar pago recibido
     */
    notifyPaymentReceived(paymentData) {
        const { pago_id, cliente_id, monto, metodo_pago, fecha_pago } = paymentData;

        console.log(`💰 Pago recibido: $${monto} - Cliente ${cliente_id}`);

        // Notificar al cliente
        if (cliente_id) {
            socketRepository.emitToUser(cliente_id, 'payment_confirmed', {
                pago_id: pago_id,
                monto: monto,
                metodo_pago: metodo_pago,
                fecha_pago: fecha_pago,
                message: `Pago de $${monto} recibido correctamente`,
                type: 'success',
                timestamp: new Date().toISOString()
            });
        }

        // Notificar a managers
        socketRepository.emitToRoom('managers', 'new_payment_received', {
            pago_id: pago_id,
            cliente_id: cliente_id,
            monto: monto,
            metodo_pago: metodo_pago,
            fecha_pago: fecha_pago,
            timestamp: new Date().toISOString()
        });

        return true;
    }

    // ========================================
    // NOTIFICACIONES GENÉRICAS
    // ========================================

    /**
     * Notificar a un usuario específico
     */
    notifyUser(userData) {
        const { user_id, event, data } = userData;

        console.log(`📨 Notificación personalizada a usuario ${user_id}: ${event}`);

        socketRepository.emitToUser(user_id, event, {
            ...data,
            timestamp: new Date().toISOString()
        });

        return true;
    }

    /**
     * Notificar a un rol/grupo
     */
    notifyRole(roleData) {
        const { role, event, data } = roleData;

        console.log(`📨 Notificación a rol ${role}: ${event}`);

        const room = `${role}s`; // managers, clientes, etc.
        socketRepository.emitToRoom(room, event, {
            ...data,
            timestamp: new Date().toISOString()
        });

        return true;
    }

    /**
     * Broadcast a todos
     */
    broadcast(broadcastData) {
        const { event, data } = broadcastData;

        console.log(`📢 Broadcast: ${event}`);

        socketRepository.emitToAll(event, {
            ...data,
            timestamp: new Date().toISOString()
        });

        return true;
    }
}

export default new ProformaService();
