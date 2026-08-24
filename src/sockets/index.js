const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const env = require('../config/env');

function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Auth handshake: client must pass a valid admin JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, env.jwtSecret);
      const admin = await Admin.findById(decoded.sub);
      if (!admin) return next(new Error('Admin account no longer exists'));
      socket.admin = { id: admin._id.toString(), name: admin.name };
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join('admins');
    console.log(`[socket] admin connected: ${socket.admin.name} (${socket.id})`);
    socket.emit('connected', { message: 'Real-time updates active' });
    socket.on('disconnect', () => {
      console.log(`[socket] admin disconnected: ${socket.admin?.name} (${socket.id})`);
    });
  });

  return io;
}

module.exports = initSockets;
