const Notification = require('../models/Notification');
const { emitToAdmins } = require('../utils/emit');

async function createNotification({ title, message = '', type = 'system', entityType = '', entityId = null }) {
  try {
    const notification = await Notification.create({ title, message, type, entityType, entityId });
    const json = notification.toJSON();
    emitToAdmins('notification:new', json);
    return json;
  } catch (err) {
    console.error('[notification] failed to create:', err.message);
    return null;
  }
}

module.exports = { createNotification };
