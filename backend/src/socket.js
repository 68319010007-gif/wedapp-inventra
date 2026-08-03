const { Server } = require('socket.io');
const config = require('./config/env');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
  });

  io.on('connection', (socket) => {
    if (config.nodeEnv === 'development') {
      console.log('Socket connected:', socket.id);
    }
    socket.on('disconnect', () => {
      if (config.nodeEnv === 'development') {
        console.log('Socket disconnected:', socket.id);
      }
    });
  });

  return io;
}

// Broadcast a single product's new stock quantity to every connected client
function emitStockUpdate(productId, quantity) {
  if (!io) return;
  io.emit('stock:updated', { productId, quantity });
}

module.exports = { initSocket, emitStockUpdate };
