const dns = require('dns');

// Fix Node.js DNS SRV resolution issue for MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

const http = require('http');
const connectDB = require('./config/db');
const createApp = require('./app');
const initSockets = require('./sockets');
const { setIO } = require('./utils/emit');
const env = require('./config/env');

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error('[server] Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  const app = createApp();
  const server = http.createServer(app);
  const io = initSockets(server);

  setIO(io);

  server.listen(env.port, () => {
    console.log(
      `[server] Tevexxo Admin API listening on http://localhost:${env.port}`
    );
    console.log(
      `[server] Socket.IO ready for real-time admin updates`
    );
  });

  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received - shutting down...`);

    io.close();

    server.close(async () => {
      const mongoose = require('mongoose');

      try {
        await mongoose.connection.close();
        console.log('[server] MongoDB connection closed');
      } catch (err) {
        console.error(
          '[server] Error closing MongoDB connection:',
          err.message
        );
      }

      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();








// const http = require('http');
// const connectDB = require('./config/db');
// const createApp = require('./app');
// const initSockets = require('./sockets');
// const { setIO } = require('./utils/emit');
// const env = require('./config/env');

// async function start() {
//   try {
//     await connectDB();
//   } catch (err) {
//     console.error('[server] Failed to connect to MongoDB:', err.message);
//     process.exit(1);
//   }

//   const app = createApp();
//   const server = http.createServer(app);
//   const io = initSockets(server);
//   setIO(io);

//   server.listen(env.port, () => {
//     console.log(`[server] Tevexxo Admin API listening on http://localhost:${env.port}`);
//     console.log(`[server] Socket.IO ready for real-time admin updates`);
//   });

//   const shutdown = async (signal) => {
//     console.log(`[server] ${signal} received - shutting down...`);
//     io.close();
//     server.close(async () => {
//       const mongoose = require('mongoose');
//       await mongoose.connection.close();
//       process.exit(0);
//     });
//   };
//   process.on('SIGINT', () => shutdown('SIGINT'));
//   process.on('SIGTERM', () => shutdown('SIGTERM'));
// }

// start();
