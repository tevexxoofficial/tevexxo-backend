const Activity = require('../models/Activity');
const { emitToAdmins } = require('../utils/emit');

async function logActivity({ type, actor = 'System', description, entity = '', entityId = null, meta = {} }) {
  try {
    const activity = await Activity.create({ type, actor, description, entity, entityId, meta });
    emitToAdmins('activity:new', activity.toJSON());
    return activity;
  } catch (err) {
    console.error('[activity] failed to log:', err.message);
    return null;
  }
}

module.exports = { logActivity };
