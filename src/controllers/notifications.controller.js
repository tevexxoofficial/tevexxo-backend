const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/admin/notifications
const listNotifications = asyncHandler(async (_req, res) => {
  const [docs, unreadCount] = await Promise.all([
    Notification.find({}).sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ read: false }),
  ]);
  res.json({ success: true, unreadCount, count: docs.length, data: docs.map((d) => d.toJSON()) });
});

// PUT /api/admin/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const doc = await Notification.findById(req.params.id);
  if (!doc) throw ApiError.notFound('Notification not found');
  doc.read = true;
  await doc.save();
  res.json({ success: true, data: doc.toJSON() });
});

// PUT /api/admin/notifications/read-all
const markAllRead = asyncHandler(async (_req, res) => {
  const result = await Notification.updateMany({ read: false }, { $set: { read: true } });
  res.json({ success: true, message: `${result.modifiedCount} notification(s) marked as read` });
});

// DELETE /api/admin/notifications/:id
const removeNotification = asyncHandler(async (req, res) => {
  const doc = await Notification.findById(req.params.id);
  if (!doc) throw ApiError.notFound('Notification not found');
  await doc.deleteOne();
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = { listNotifications, markRead, markAllRead, removeNotification };
