const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/admin/audit-logs?entity=COURSE&action=UPDATE&adminId=...&limit=50
const listAuditLogs = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
  const filter = {};
  if (req.query.entity) filter.entity = String(req.query.entity).toUpperCase();
  if (req.query.action) filter.action = String(req.query.action).toUpperCase();
  if (req.query.adminId) filter.adminId = req.query.adminId;
  if (req.query.entityId) filter.entityId = String(req.query.entityId);

  const [docs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  res.json({ success: true, total, count: docs.length, data: docs.map((d) => d.toJSON()) });
});

// GET /api/admin/audit-logs/:id
const getAuditLog = asyncHandler(async (req, res) => {
  const doc = await AuditLog.findById(req.params.id);
  if (!doc) throw ApiError.notFound('Audit log not found');
  res.json({ success: true, data: doc.toJSON() });
});

module.exports = { listAuditLogs, getAuditLog };
