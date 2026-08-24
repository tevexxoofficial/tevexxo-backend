const Setting = require('../models/Setting');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../services/audit.service');

const SETTINGS_KEY = 'global';

// GET /api/admin/settings
const getSettings = asyncHandler(async (_req, res) => {
  let settings = await Setting.findOne({ key: SETTINGS_KEY });
  if (!settings) settings = await Setting.create({ key: SETTINGS_KEY });
  res.json({ success: true, data: settings.toJSON() });
});

// PUT /api/admin/settings
const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne({ key: SETTINGS_KEY });
  if (!settings) settings = await Setting.create({ key: SETTINGS_KEY });

  const oldData = settings.toJSON();
  const allowedTop = ['siteName', 'siteEmail', 'siteDescription', 'timezone', 'currency', 'maintenanceMode'];
  const toggles = ['emailNotifications', 'newUserRegistration', 'newEnrollment', 'paymentReceived', 'newInquiry'];

  for (const field of allowedTop) {
    if (field in req.body) settings[field] = typeof req.body[field] === 'boolean' ? req.body[field] : String(req.body[field]).trim();
  }
  if (req.body.notifications && typeof req.body.notifications === 'object') {
    for (const t of toggles) {
      if (t in req.body.notifications) settings.notifications[t] = Boolean(req.body.notifications[t]);
    }
  }
  await settings.save();

  await writeAudit({
    req,
    action: 'SETTINGS_UPDATE',
    entity: 'SETTINGS',
    entityId: settings._id.toString(),
    description: 'Admin settings updated',
    oldData,
    newData: settings.toJSON(),
  });

  res.json({ success: true, data: settings.toJSON() });
});

module.exports = { getSettings, updateSettings };
