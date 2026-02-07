const { Server } = require('socket.io');
const imapService = require('./imapService');

let io = null;
const sessionSockets = new Map(); // sessionId -> Set of socket ids

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔗 Client connected: ${socket.id}`);

    // Subscribe to inbox updates
    socket.on('subscribe', (sessionId) => {
      if (!sessionSockets.has(sessionId)) {
        sessionSockets.set(sessionId, new Set());
      }
      sessionSockets.get(sessionId).add(socket.id);
      socket.sessionId = sessionId;
      console.log(`📬 Socket ${socket.id} subscribed to session ${sessionId}`);
    });

    // Unsubscribe from inbox updates
    socket.on('unsubscribe', (sessionId) => {
      if (sessionSockets.has(sessionId)) {
        sessionSockets.get(sessionId).delete(socket.id);
        if (sessionSockets.get(sessionId).size === 0) {
          sessionSockets.delete(sessionId);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      if (socket.sessionId && sessionSockets.has(socket.sessionId)) {
        sessionSockets.get(socket.sessionId).delete(socket.id);
        if (sessionSockets.get(socket.sessionId).size === 0) {
          sessionSockets.delete(socket.sessionId);
        }
      }
    });
  });

  // Listen for new emails from IMAP service
  imapService.on('newEmail', ({ sessionId, email }) => {
    if (sessionSockets.has(sessionId)) {
      const socketIds = sessionSockets.get(sessionId);
      socketIds.forEach((socketId) => {
        io.to(socketId).emit('newEmail', email);
      });
      console.log(`📤 Emitted newEmail to ${socketIds.size} sockets for session ${sessionId}`);
    }
  });

  return io;
}

function getIO() {
  return io;
}

function emitToSession(sessionId, event, data) {
  if (io && sessionSockets.has(sessionId)) {
    const socketIds = sessionSockets.get(sessionId);
    socketIds.forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });
  }
}

module.exports = { initSocket, getIO, emitToSession };
