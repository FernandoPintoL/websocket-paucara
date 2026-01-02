import notificationService from './notification.service.js';
import activeUsersRepository from '../repositories/activeUsers.repository.js';
import socketRepository from '../repositories/socket.repository.js';
import { validateProformaEstado } from '../utils/state-validator.js';

/**
 * Servicio especializado para notificaciones de proformas
 * Maneja el filtrado por rol y emite a los usuarios correspondientes
 */
class ProformaNotificationService {
  /**
   * Notificar cuando se crea una proforma
   * Destinatarios: Preventistas, Cajeros, Managers, Admins
   * Fase 2: Ahora valida el estado contra la BD centralizada
   */
  async notifyProformaCreated(data) {
    // Destructuring con valores por defecto
    let {
      id,
      numero,
      cliente_id,
      cliente = {},
      total,
      items = [],
      fecha_creacion,
      fecha_vencimiento,
      estado = 'PENDIENTE',
      usuario_creador = {}
    } = data;

    // Fase 2: Validar estado contra estados centralizados
    const validation = await validateProformaEstado(estado);
    if (!validation.valid) {
      console.warn(`⚠️  Estado inválido en proforma: ${estado}. Usando fallback: PENDIENTE`);
      estado = 'PENDIENTE';
    } else {
      console.log(`✅ Estado de proforma validado: ${estado}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📋 Notificación: Proforma Creada');
    console.log(`   Proforma: ${numero} (ID: ${id})`);
    console.log(`   Cliente: ${cliente?.nombre} ${cliente?.apellido} (ID: ${cliente_id})`);
    console.log(`   Total: ${total}`);
    console.log(`   Items: ${items?.length || 0}`);
    console.log(`   Fecha Creación: ${fecha_creacion}`);
    console.log(`   Fecha Vencimiento: ${fecha_vencimiento || 'Sin vencimiento'}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Preparar datos para emitir
    const notificationData = {
      proforma_id: id,
      proforma_numero: numero,
      numero: numero,
      cliente_id: cliente_id,
      cliente: cliente,
      usuario_creador: usuario_creador,
      total: total || 0,
      items: items || [],
      items_count: items?.length || 0,
      fecha_creacion: fecha_creacion,
      fecha_vencimiento: fecha_vencimiento,
      estado: estado,
      timestamp: new Date().toISOString(),
    };

    // Emitir a los grupos que deben recibir esta notificación
    // Profesionales: preventista, cajero, manager, admin
    // Clientes: también deben recibir para ver estado de sus proformas
    const targetRoles = ['preventista', 'cajero', 'manager', 'admin'];

    // Emitir a cada rol profesional
    for (const role of targetRoles) {
      const room = `${role}s`; // cobradores, preventistas, cajeros, managers, admins
      socketRepository.emitToRoom(room, 'proforma.creada', notificationData);
      console.log(`   ✅ Enviado a sala: ${room}`);
    }

    // ✅ IMPORTANTE: También enviar a todos los clientes (cliente type users)
    // Los clientes necesitan recibir notificaciones de sus propias proformas
    socketRepository.emitToRoom('clients', 'proforma.creada', notificationData);
    console.log(`   ✅ Enviado a sala: clients`);

    // También notificar al cliente directamente por su ID
    if (cliente_id) {
      socketRepository.emitToUser(cliente_id, 'proforma_created_confirmation', {
        proforma_id: id,
        numero: numero,
        total: total || 0,
        items_count: items?.length || 0,
        message: '✅ Tu pedido ha sido recibido y está en revisión',
        type: 'success',
        timestamp: new Date().toISOString()
      });
      console.log(`   ✅ Enviado a cliente directo: ${cliente_id}`);
    }

    return true;
  }

  /**
   * Notificar cuando se aprueba una proforma
   * Destinatarios: Cliente, Managers, Admins, Preventistas
   */
  notifyProformaApproved(data) {
    const {
      id,
      numero,
      proforma_numero = numero,
      cliente_id,
      cliente = {},
      total,
      usuario_aprobador = {},
    } = data;

    console.log('✅ Notificación: Proforma Aprobada');
    console.log(`   Proforma: ${proforma_numero} (ID: ${id})`);
    console.log(`   Aprobador: ${usuario_aprobador?.name || 'Sistema'}`);
    console.log(`   Cliente: ${cliente?.nombre} (ID: ${cliente_id})`);

    const targetRoles = ['preventista', 'manager', 'admin'];

    // Emitir a roles específicos
    for (const role of targetRoles) {
      const room = `${role}s`;
      socketRepository.emitToRoom(room, 'proforma.aprobada', {
        proforma_id: id,
        numero: proforma_numero,
        cliente_id: cliente_id,
        cliente: cliente,
        total: total,
        usuario_aprobador: usuario_aprobador,
        timestamp: new Date().toISOString(),
      });
      console.log(`   ✅ Enviado a sala: ${room}`);
    }

    // ✅ También enviar a todos los clientes
    socketRepository.emitToRoom('clients', 'proforma.aprobada', {
      proforma_id: id,
      numero: proforma_numero,
      cliente_id: cliente_id,
      cliente: cliente,
      total: total,
      usuario_aprobador: usuario_aprobador,
      timestamp: new Date().toISOString(),
    });
    console.log(`   ✅ Enviado a sala: clients`);

    // Si hay cliente_id, notificar al cliente directo también
    if (cliente_id) {
      socketRepository.emitToUser(cliente_id, 'proforma.aprobada', {
        proforma_id: id,
        numero: proforma_numero,
        cliente_id: cliente_id,
        cliente: cliente,
        total: total,
        usuario_aprobador: usuario_aprobador,
        message: '🎉 Tu proforma ha sido aprobada',
        timestamp: new Date().toISOString(),
      });
      console.log(`   ✅ Enviado a cliente directo: ${cliente_id}`);
    }

    return true;
  }

  /**
   * Notificar cuando se rechaza una proforma
   * Destinatarios: Cliente, Managers, Admins, Preventistas
   */
  notifyProformaRejected(data) {
    const {
      id,
      numero,
      proforma_numero = numero,
      cliente_id,
      cliente = {},
      motivo_rechazo,
    } = data;

    console.log('❌ Notificación: Proforma Rechazada');
    console.log(`   Proforma: ${proforma_numero} (ID: ${id})`);
    console.log(`   Cliente: ${cliente?.nombre} (ID: ${cliente_id})`);
    console.log(`   Motivo: ${motivo_rechazo || 'No especificado'}`);

    const targetRoles = ['preventista', 'manager', 'admin'];

    // Emitir a roles específicos
    for (const role of targetRoles) {
      const room = `${role}s`;
      socketRepository.emitToRoom(room, 'proforma.rechazada', {
        proforma_id: id,
        numero: proforma_numero,
        cliente_id: cliente_id,
        cliente: cliente,
        motivo_rechazo: motivo_rechazo,
        timestamp: new Date().toISOString(),
      });
      console.log(`   ✅ Enviado a sala: ${room}`);
    }

    // ✅ También enviar a todos los clientes
    socketRepository.emitToRoom('clients', 'proforma.rechazada', {
      proforma_id: id,
      numero: proforma_numero,
      cliente_id: cliente_id,
      cliente: cliente,
      motivo_rechazo: motivo_rechazo,
      timestamp: new Date().toISOString(),
    });
    console.log(`   ✅ Enviado a sala: clients`);

    // Notificar al cliente directo
    if (cliente_id) {
      socketRepository.emitToUser(cliente_id, 'proforma.rechazada', {
        proforma_id: id,
        numero: proforma_numero,
        cliente_id: cliente_id,
        cliente: cliente,
        motivo_rechazo: motivo_rechazo,
        message: '❌ Tu proforma ha sido rechazada',
        timestamp: new Date().toISOString(),
      });
      console.log(`   ✅ Enviado a cliente directo: ${cliente_id}`);
    }

    return true;
  }

  /**
   * Notificar cuando se convierte una proforma a venta
   * Destinatarios: Logística, Cobradores, Managers, Admins
   */
  notifyProformaConverted(data) {
    console.log('🎉 Notificación: Proforma Convertida');
    console.log(`   Proforma: ${data.proforma_numero}`);
    console.log(`   Venta: ${data.venta_numero}`);

    const targetRoles = ['logistica', 'cobrador', 'manager', 'admin'];

    // Emitir a cada rol
    for (const role of targetRoles) {
      const room = `${role}s`;
      socketRepository.emitToRoom(room, 'proforma.convertida', {
        ...data,
        notificationId: data.proforma_id,
        timestamp: new Date().toISOString(),
      });
      console.log(`   ✅ Enviado a sala: ${room}`);
    }

    return true;
  }

  /**
   * Notificar sobre stock reservado para una proforma
   * Destinatarios: Managers, Admins
   */
  notifyStockReserved(data) {
    console.log('📦 Notificación: Stock Reservado');
    console.log(`   Proforma: ${data.proforma_numero}`);
    console.log(`   Items: ${data.items?.length || 0}`);

    const targetRoles = ['manager', 'admin'];

    for (const role of targetRoles) {
      const room = `${role}s`;
      socketRepository.emitToRoom(room, 'proforma.stock_reservado', {
        ...data,
        notificationId: data.proforma_id,
        timestamp: new Date().toISOString(),
      });
      console.log(`   ✅ Enviado a sala: ${room}`);
    }

    return true;
  }

  /**
   * Notificar cuando una reserva está a punto de vencer
   * Destinatarios: Managers, Admins
   */
  notifyReservationExpiring(data) {
    console.log('⏰ Notificación: Reserva por Vencer');
    console.log(`   Proforma: ${data.proforma_numero}`);
    console.log(`   Vence en: ${data.minutes_remaining} minutos`);

    const targetRoles = ['manager', 'admin'];

    for (const role of targetRoles) {
      const room = `${role}s`;
      socketRepository.emitToRoom(room, 'proforma.reserva_venciendo', {
        ...data,
        notificationId: data.proforma_id,
        timestamp: new Date().toISOString(),
      });
      console.log(`   ✅ Enviado a sala: ${room}`);
    }

    return true;
  }

  /**
   * Obtener usuarios activos por rol
   */
  getUsersByRole(role) {
    const allUsers = activeUsersRepository.getAllUsers();
    return allUsers.filter((user) => user.userType === role);
  }

  /**
   * Obtener estadísticas de usuarios conectados
   */
  getConnectedStats() {
    const allUsers = activeUsersRepository.getAllUsers();

    const stats = {
      total: allUsers.length,
      by_role: {},
      users: allUsers.map((u) => ({
        userId: u.userId,
        userName: u.userName,
        userType: u.userType,
        socketId: u.socketId,
        connectedAt: u.connectedAt,
      })),
    };

    // Contar por rol
    for (const user of allUsers) {
      const role = user.userType || 'unknown';
      stats.by_role[role] = (stats.by_role[role] || 0) + 1;
    }

    return stats;
  }

  /**
   * Registrar notificación crítica en log
   */
  logCriticalNotification(event, data) {
    const timestamp = new Date().toISOString();
    console.log(`🔴 CRITICAL NOTIFICATION - ${timestamp}`);
    console.log(`   Event: ${event}`);
    console.log(`   Data:`, JSON.stringify(data, null, 2));
  }
}

export default new ProformaNotificationService();
