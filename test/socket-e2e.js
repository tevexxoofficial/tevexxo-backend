/* E2E realtime test: login -> connect socket -> trigger CRUD via REST -> expect socket event */
const { io } = require('socket.io-client');

const BASE = 'http://localhost:5000';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const loginRes = await fetch(`${BASE}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@tevexxo.com', password: 'Admin@12345' }),
  }).then((r) => r.json());
  if (!loginRes.token) throw new Error('login failed');
  console.log('[e2e] logged in');

  const events = [];
  const socket = io(BASE, { auth: { token: loginRes.token } });

  ['entity:changed', 'notification:new', 'activity:new', 'connect_error'].forEach((ev) =>
    socket.on(ev, (payload) => {
      events.push({ ev, payload });
      console.log(`[socket] ${ev} received`, ev === 'entity:changed' ? `(${payload.action} ${payload.resource})` : '');
    })
  );

  await sleep(800);

  // CREATE a course via REST - should emit entity:changed + activity + notification
  const created = await fetch(`${BASE}/api/admin/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginRes.token}` },
    body: JSON.stringify({ name: 'Socket E2E Course', category: 'Testing', status: 'Draft' }),
  }).then((r) => r.json());
  console.log(`[e2e] created course ${created.data.id}`);

  await sleep(1000);

  // DELETE it
  await fetch(`${BASE}/api/admin/courses/${created.data.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${loginRes.token}` },
  });
  console.log('[e2e] deleted course');
  await sleep(1000);

  socket.disconnect();

  const ok =
    events.some((e) => e.ev === 'entity:changed' && e.payload.action === 'create') &&
    events.some((e) => e.ev === 'entity:changed' && e.payload.action === 'delete') &&
    events.some((e) => e.ev === 'activity:new') &&
    events.some((e) => e.ev === 'notification:new');

  console.log(ok ? '[e2e] SOCKET.IO REALTIME: PASS' : `[e2e] SOCKET.IO REALTIME: FAIL (${events.map((e) => e.ev).join(', ')})`);
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error('[e2e] FAILED:', err.message);
  process.exit(1);
});
