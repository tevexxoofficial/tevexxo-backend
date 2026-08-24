const AuditLog = require('../models/AuditLog');

/**
 * Writes an audit log for an admin action.
 * Normally reads the authenticated admin from req.admin (protect middleware).
 * For login (no req.admin yet), pass adminId + adminName explicitly.
 */
async function writeAudit({ req, action, entity, entityId = null, description = '', oldData = null, newData = null, adminId = null, adminName = null }) {
  try {
    const resolvedId = adminId || req?.admin?.id || req?.admin?._id;
    const resolvedName = adminName || req?.admin?.name || 'Unknown';
    if (!resolvedId) {
      console.error('[audit] skipped: no admin identity available');
      return null;
    }
    return await AuditLog.create({
      adminId: resolvedId,
      adminName: resolvedName,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      description,
      oldData: oldData || null,
      newData: newData || null,
      ip: req?.ip || '',
    });
  } catch (err) {
    console.error('[audit] failed to write log:', err.message);
    return null;
  }
}

module.exports = { writeAudit };
