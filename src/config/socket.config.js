// Configuración de Socket.IO optimizada para móviles
export const socketConfig = {
    pingTimeout: 30000,
    pingInterval: 10000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e6,
    allowEIO3: true
};

// Puerto del servidor
export const getPort = () => {
    return process.env.PORT || process.env.WEBSOCKET_PORT || 3001;
};
