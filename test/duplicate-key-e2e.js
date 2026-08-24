/* Verifies: ONE Save -> ONE POST -> ONE Mongo doc -> ONE state entry (even with socket echo) */
const { io } = require('socket.io-client');
const BASE = 'http://localhost:5000';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Exact replicas of the FIXED frontend reducers (page.tsx)
function restInsert(state, key, doc, isNew) {
  const list = state[key] || [];
  const next = list.some((i) => i.id === doc.id)
    ? list.map((i) => (i.id === doc.id ? doc : i))
    : isNew ? [doc, ...list] : list;
  return { ...state, [key]: next };
}
function socketApply(state, payload) {
  const list = state[payload.resource] || [];
  if (payload.action === 'create' || payload.action === 'update') {
    return {
      ...state,
      [payload.resource]: list.some((i) => i.id === payload.doc.id)
        ? list.map((i) => (i.id === payload.doc.id ? payload.doc : i))
        : [payload.doc, ...list],
    };
  }
  return { ...state, [payload.resource]: list.filter((i) => i.id !== payload.doc.id) };
}

async function mongoCount(name) {
  // count via API list endpoint instead of direct db access
  return null;
}

async function main() {
  const login = await fetch(`${BASE}/api/admin/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@tevexxo.com', password: 'Admin@12345' }),
  }).then((r) => r.json());
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${login.token}` };

  const before = await fetch(`${BASE}/api/admin/courses`, { headers: { Authorization: `Bearer ${login.token}` } }).then((r) => r.json());
  const beforeCount = before.count;

  // Seed state exactly like the real page does on page load (GET /courses)
  let state = { courses: [...before.data] };
  const socketIdsSeen = [];

  const socket = io(BASE, { auth: { token: login.token } });
  socket.on('entity:changed', (payload) => {
    socketIdsSeen.push(payload.doc.id);
    console.log(`[COURSE SOCKET] received ${payload.action} id=${payload.doc.id}`);
    state = socketApply(state, payload);
  });
  await sleep(700);

  // === THE SINGLE SAVE CLICK ===
  console.log('--- SAVE CLICK: sending ONE POST ---');
  const created = await fetch(`${BASE}/api/admin/courses`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ name: 'DupKey Fix Verification', category: 'QA', status: 'Published', detail: 'one click only' }),
  }).then((r) => r.json());
  console.log(`[COURSE CREATE] POST response id=${created.data.id}`);
  state = restInsert(state, 'courses', created.data, true);

  await sleep(1200); // let the socket echo arrive

  // === ASSERTIONS ===
  const after = await fetch(`${BASE}/api/admin/courses`, { headers: { Authorization: `Bearer ${login.token}` } }).then((r) => r.json());
  const inDb = after.data.filter((c) => c.name === 'DupKey Fix Verification');

  const checks = [
    ['ONE POST -> API returned exactly one object', !!created.data.id],
    ['MongoDB has exactly ONE document for this creation', inDb.length === 1],
    [`Mongo course count grew by exactly 1 (${beforeCount} -> ${after.count})`, after.count - beforeCount === 1],
    ['Socket delivered the event exactly ONCE', socketIdsSeen.filter((id) => id === created.data.id).length === 1],
    ['React-equivalent state contains the id EXACTLY once', (state.courses || []).filter((c) => c.id === created.data.id).length === 1],
    ['State length == GET /courses count (no phantom rows)', (state.courses || []).length === after.count],
  ];
  let ok = true;
  for (const [name, pass] of checks) { console.log(`${pass ? 'PASS' : 'FAIL'} | ${name}`); if (!pass) ok = false; }

  // cleanup
  await fetch(`${BASE}/api/admin/courses/${created.data.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${login.token}` } });
  await sleep(600);
  const cleaned = await fetch(`${BASE}/api/admin/courses`, { headers: { Authorization: `Bearer ${login.token}` } }).then((r) => r.json());
  const delOk = cleaned.count === beforeCount && !(state.courses || []).some((c) => c.id === created.data.id);
  console.log(`${delOk ? 'PASS' : 'FAIL'} | DELETE removes from DB and state (socket delete applied)`);
  ok = ok && delOk;

  socket.disconnect();
  console.log(ok ? '\n==== ALL DUPLICATE-KEY CHECKS PASSED ====' : '\n==== FAILURES PRESENT ====');
  process.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error('E2E FAILED:', e); process.exit(1); });
