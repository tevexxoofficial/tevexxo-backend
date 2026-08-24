const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../middleware/auth');
const { writeAudit } = require('../services/audit.service');
const { logActivity } = require('../services/activity.service');

// POST /api/admin/auth/login
const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) throw ApiError.badRequest('Email and password are required');

  const admin = await Admin.findOne({ email });
  if (!admin) throw ApiError.unauthorized('Invalid email or password');

  const match = await bcrypt.compare(password, admin.password);
  if (!match) throw ApiError.unauthorized('Invalid email or password');

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signToken(admin);
  await writeAudit({ req, action: 'LOGIN', entity: 'AUTH', entityId: admin._id.toString(), description: `${admin.name} logged in`, adminId: admin._id.toString(), adminName: admin.name });
  await logActivity({ type: 'ADMIN_LOGIN', actor: admin.name, description: `${admin.name} signed in to the admin panel`, entity: 'AUTH', entityId: admin._id.toString() });

  res.json({
    success: true,
    token,
    data: admin.toJSON(),
  });
});

// POST /api/admin/auth/logout (stateless JWT - client discards token; we audit the event)
const logout = asyncHandler(async (req, res) => {
  await writeAudit({ req, action: 'LOGOUT', entity: 'AUTH', entityId: req.admin.id, description: `${req.admin.name} logged out` });
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/admin/auth/me
const me = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin.id);
  if (!admin) throw ApiError.unauthorized('Admin account no longer exists');
  res.json({ success: true, data: admin.toJSON() });
});

// PUT /api/admin/auth/profile - update own profile
const updateProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin.id);
  if (!admin) throw ApiError.unauthorized('Admin account no longer exists');

  const allowed = ['name', 'phone', 'location', 'bio'];
  const changes = {};
  for (const field of allowed) {
    if (field in req.body && String(admin[field]) !== String(req.body[field])) {
      changes[field] = { from: admin[field], to: String(req.body[field]).trim() };
      admin[field] = String(req.body[field]).trim();
    }
  }
  if (!Object.keys(changes).length) throw ApiError.badRequest('No changes detected');
  await admin.save();

  await writeAudit({ req, action: 'PROFILE_UPDATE', entity: 'ADMIN', entityId: admin._id.toString(), description: 'Profile updated', oldData: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.from])), newData: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.to])) });
  await logActivity({ type: 'ADMIN_PROFILE_UPDATED', actor: admin.name, description: `${admin.name} updated their profile`, entity: 'ADMIN', entityId: admin._id.toString(), meta: { fields: Object.keys(changes) } });

  res.json({ success: true, data: admin.toJSON() });
});

// PUT /api/admin/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const currentPassword = String(req.body.currentPassword || '');
  const newPassword = String(req.body.newPassword || '');
  if (!currentPassword || !newPassword) throw ApiError.badRequest('currentPassword and newPassword are required');
  if (newPassword.length < 8) throw ApiError.badRequest('New password must be at least 8 characters');

  const admin = await Admin.findById(req.admin.id).select('+password');
  if (!admin) throw ApiError.unauthorized('Admin account no longer exists');

  const match = await bcrypt.compare(currentPassword, admin.password);
  if (!match) throw ApiError.badRequest('Current password is incorrect');

  admin.password = await bcrypt.hash(newPassword, 10);
  await admin.save();

  await writeAudit({ req, action: 'PASSWORD_CHANGE', entity: 'AUTH', entityId: admin._id.toString(), description: 'Password changed' });

  res.json({ success: true, message: 'Password changed successfully' });
});

module.exports = { login, logout, me, updateProfile, changePassword };
