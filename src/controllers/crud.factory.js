const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../services/audit.service');
const { logActivity } = require('../services/activity.service');
const { createNotification } = require('../services/notification.service');
const { emitToAdmins } = require('../utils/emit');

const NON_WRITABLE = new Set(['_id', 'id', '__v', 'createdAt', 'updatedAt']);

function writableFields(Model) {
  return Object.keys(Model.schema.paths).filter((p) => !NON_WRITABLE.has(p));
}

/** Coerce values to match schema types (numbers etc.) and drop unknown keys */
function sanitizePayload(Model, payload) {
  const out = {};
  for (const field of writableFields(Model)) {
    if (!(field in payload)) continue;
    let value = payload[field];
    const pathType = Model.schema.paths[field].instance;
    if (value === '' && pathType === 'Number') value = 0;
    if (pathType === 'Number') {
      const num = Number(value);
      if (value !== '' && value != null && Number.isNaN(num)) {
        throw ApiError.badRequest(`Field "${field}" must be a number`);
      }
      value = num;
    }
    if (typeof value === 'string') value = value.trim();
    out[field] = value;
  }
  return out;
}

function pickPublic(doc) {
  return doc ? doc.toJSON() : null;
}

/**
 * Builds list/getOne/create/update/remove handlers for an Admin UI entity.
 * Every mutation writes an AuditLog + Activity, emits Socket.IO events and
 * optionally creates a Notification.
 */
function createCrudController({ Model, entity, resource, label, requiredOnCreate = ['name'], notifyOnCreate = true }) {
  const list = asyncHandler(async (_req, res) => {
    const docs = await Model.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: docs.length, data: docs.map(pickPublic) });
  });

  const getOne = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw ApiError.notFound(`${label} not found`);
    res.json({ success: true, data: pickPublic(doc) });
  });

  const create = asyncHandler(async (req, res) => {
    const missing = requiredOnCreate.filter((f) => !String(req.body[f] || '').trim());
    if (missing.length) throw ApiError.badRequest(`Missing required field(s): ${missing.join(', ')}`);

    const payload = sanitizePayload(Model, req.body);
    const doc = await Model.create(payload);
    const json = pickPublic(doc);

    await writeAudit({
      req,
      action: 'CREATE',
      entity,
      entityId: json.id,
      description: `${label} "${json.name}" created`,
      newData: json,
    });
    await logActivity({
      type: `${label.toUpperCase().replace(/ /g, '_')}_CREATED`,
      actor: req.admin.name,
      description: `${label} "${json.name}" created by ${req.admin.name}`,
      entity,
      entityId: json.id,
    });
    if (notifyOnCreate) {
      await createNotification({
        title: `New ${label.toLowerCase()} added`,
        message: `"${json.name}" was created by ${req.admin.name}`,
        type: resource.replace(/s$/, ''),
        entityType: entity,
        entityId: json.id,
      });
    }
    emitToAdmins('entity:changed', { action: 'create', resource, doc: json });

    res.status(201).json({ success: true, data: json });
  });

  const update = asyncHandler(async (req, res) => {
    const existing = await Model.findById(req.params.id);
    if (!existing) throw ApiError.notFound(`${label} not found`);

    const payload = sanitizePayload(Model, req.body);
    const oldData = pickPublic(existing);
    const changedFields = Object.keys(payload).filter(
      (f) => String(oldData[f]) !== String(payload[f])
    );
    if (!changedFields.length) throw ApiError.badRequest('No changes detected');

    const statusChanged = 'status' in payload && payload.status !== oldData.status;

    Object.assign(existing, payload);
    await existing.save();
    const json = pickPublic(existing);

    await writeAudit({
      req,
      action: statusChanged ? 'STATUS_CHANGE' : 'UPDATE',
      entity,
      entityId: json.id,
      description: `${label} "${json.name}" updated (${changedFields.join(', ')})`,
      oldData,
      newData: json,
    });
    await logActivity({
      type: `${label.toUpperCase().replace(/ /g, '_')}_${statusChanged ? 'STATUS_CHANGED' : 'UPDATED'}`,
      actor: req.admin.name,
      description: `${label} "${json.name}" ${statusChanged ? `status changed to ${json.status}` : 'updated'} by ${req.admin.name}`,
      entity,
      entityId: json.id,
      meta: { changedFields },
    });
    emitToAdmins('entity:changed', { action: 'update', resource, doc: json });

    res.json({ success: true, data: json });
  });

  const remove = asyncHandler(async (req, res) => {
    const existing = await Model.findById(req.params.id);
    if (!existing) throw ApiError.notFound(`${label} not found`);
    const oldData = pickPublic(existing);

    await existing.deleteOne();

    await writeAudit({
      req,
      action: 'DELETE',
      entity,
      entityId: String(oldData.id),
      description: `${label} "${oldData.name}" deleted`,
      oldData,
    });
    await logActivity({
      type: `${label.toUpperCase().replace(/ /g, '_')}_DELETED`,
      actor: req.admin.name,
      description: `${label} "${oldData.name}" deleted by ${req.admin.name}`,
      entity,
      entityId: String(oldData.id),
    });
    emitToAdmins('entity:changed', { action: 'delete', resource, doc: oldData });

    res.json({ success: true, message: `${label} deleted successfully` });
  });

  return { list, getOne, create, update, remove };
}

module.exports = { createCrudController };
