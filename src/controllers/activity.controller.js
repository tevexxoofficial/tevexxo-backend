const Activity = require('../models/Activity');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/admin/activity
const listActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const filter = req.query.type ? { type: String(req.query.type) } : {};
  const docs = await Activity.find(filter).sort({ createdAt: -1 }).limit(limit);
  res.json({ success: true, count: docs.length, data: docs.map((d) => d.toJSON()) });
});

// GET /api/admin/activity/recent?limit=6
const recentActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '6', 10), 50);
  const docs = await Activity.find({}).sort({ createdAt: -1 }).limit(limit);
  res.json({ success: true, count: docs.length, data: docs.map((d) => d.toJSON()) });
});

// GET /api/admin/activity/stats - counts grouped by day (last 14 days)
const activityStats = asyncHandler(async (_req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 14);
  since.setHours(0, 0, 0, 0);

  const [byDay, byType, total] = await Promise.all([
    Activity.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateTrunc: { date: '$createdAt', unit: 'day' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Activity.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Activity.countDocuments({}),
  ]);

  res.json({
    success: true,
    data: {
      total,
      last14Days: byDay.map((d) => ({
        date: d._id ? new Date(d._id).toISOString().slice(0, 10) : null,
        count: d.count,
      })),
      byType: byType.map((t) => ({ type: t._id, count: t.count })),
    },
  });
});

module.exports = { listActivity, recentActivity, activityStats };
