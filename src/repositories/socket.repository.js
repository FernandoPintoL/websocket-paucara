// Repositorio para operaciones de Socket.IO
class SocketRepository {
    constructor() {
        this.io = null;
    }

    // Inicializar io
    setIO(ioInstance) {
        this.io = ioInstance;
    }

    // Emitir a un usuario específico
    emitToUser(userId, event, data) {
        if (!this.io) {
            console.error('Socket.IO not initialized');
            return false;
        }
        // Normalizar userId a string para consistencia
        const normalizedUserId = String(userId);
        this.io.to(`user_${normalizedUserId}`).emit(event, data);
        return true;
    }

    // Emitir a una sala/grupo
    emitToRoom(room, event, data) {
        if (!this.io) {
            console.error('Socket.IO not initialized');
            return false;
        }
        this.io.to(room).emit(event, data);
        return true;
    }

    // Emitir a todos
    emitToAll(event, data) {
        if (!this.io) {
            console.error('Socket.IO not initialized');
            return false;
        }
        this.io.emit(event, data);
        return true;
    }

    // Unir socket a sala
    joinRoom(socket, room) {
        socket.join(room);
    }

    // Salir de sala
    leaveRoom(socket, room) {
        socket.leave(room);
    }

    // Broadcast desde un socket (excluye el emisor)
    broadcast(socket, event, data) {
        socket.broadcast.emit(event, data);
    }

    // Emitir log del servidor (para debugging)
    emitServerLog(message) {
        if (this.io) {
            this.io.emit('server_log', message);
        }
    }
}

// Singleton
export default new SocketRepository();
