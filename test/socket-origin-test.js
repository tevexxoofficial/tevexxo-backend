/* Verify Socket.IO accepts connections from http://localhost:3001 */
const { io } = require('socket.io-client');
const BASE = 'http://localhost:5000';

async function main() {
  const loginRes = await fetch(`${BASE}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3001' },
    body: JSON.stringify({ email: 'admin@tevexxo.com', password: 'Admin@12345' }),
  }).then((r) => r.json());
  if (!loginRes.token) throw new Error('login failed');

  await new Promise((resolve, reject) => {
    const socket = io(BASE, {
      auth: { token: loginRes.token },
      extraHeaders: { Origin: 'http://localhost:3001' }, // simulate browser at :3001
      transports: ['websocket'],
    });
    const timeout = setTimeout(() => { socket.disconnect(); reject(new Error('connection timeout')); }, 8000);
    socket.on('connect', () => {
      clearTimeout(timeout);
      console.log('[socket] CONNECTED from origin http://localhost:3001, id=' + socket.id);
      socket.disconnect();
      resolve();
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timeout);
      reject(new Error('handshake rejected: ' + err.message));
    });
  });
  console.log('[socket] CORS for Socket.IO from :3001 -> PASS');
}

main().catch((e) => { console.error('[socket] FAIL:', e.message); process.exit(1); });
