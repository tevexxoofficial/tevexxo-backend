let io = null;

function setIO(instance) {
  io = instance;
}

function emitToAdmins(event, payload) {
  if (!io) return;
  io.to('admins').emit(event, payload);
}

module.exports = { setIO, emitToAdmins };
