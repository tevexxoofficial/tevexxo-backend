const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Order = require('../models/Order');
const Inquiry = require('../models/Inquiry');
const Activity = require('../models/Activity');
const asyncHandler = require('../utils/asyncHandler');

function parseAmount(amount) {
  if (typeof amount === 'number') return amount;
  const digits = String(amount || '').replace(/[^0-9.]/g, '');
  return Number(digits) || 0;
}

function formatINR(total) {
  return `₹${Number(total).toLocaleString('en-IN')}`;
}

function growthPct(current, previous) {
  if (!previous) return current > 0 ? '+100.0%' : '0.0%';
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

async function buildStats() {
  const now = new Date();
  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalUsers,
    totalEnrollments,
    activeCoursesRaw,
    orders,
    activeEnrollments,
    totalSessions,
    usersThisMonth,
    usersLastMonth,
    enrollmentsThisMonth,
    enrollmentsLastMonth,
    sessionsThisMonth,
    sessionsLastMonth,
    coursesThisMonth,
  ] = await Promise.all([
    User.countDocuments({}),
    Enrollment.countDocuments({}),
    Course.countDocuments({ status: 'Published' }),
    Order.find({}).select('amount status createdAt').lean(),
    Enrollment.countDocuments({ status: 'Active' }),
    // Sessions = recorded platform activity events (the interaction stream we persist)
    Activity.countDocuments({}),
    User.countDocuments({ createdAt: { $gte: startThisMonth } }),
    User.countDocuments({ createdAt: { $gte: startLastMonth, $lt: startThisMonth } }),
    Enrollment.countDocuments({ createdAt: { $gte: startThisMonth } }),
    Enrollment.countDocuments({ createdAt: { $gte: startLastMonth, $lt: startThisMonth } }),
    Activity.countDocuments({ createdAt: { $gte: startThisMonth } }),
    Activity.countDocuments({ createdAt: { $gte: startLastMonth, $lt: startThisMonth } }),
    Course.countDocuments({ createdAt: { $gte: startThisMonth } }),
  ]);

  const paidOrders = orders.filter((o) => o.status !== 'Refunded');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + parseAmount(o.amount), 0);
  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;

  const revenueBetween = (from, to) =>
    paidOrders
      .filter((o) => o.createdAt && o.createdAt >= from && (!to || o.createdAt < to))
      .reduce((sum, o) => sum + parseAmount(o.amount), 0);
  const revenueThisMonth = revenueBetween(startThisMonth, null);
  const revenueLastMonth = revenueBetween(startLastMonth, startThisMonth);

  return {
    totalUsers,
    totalEnrollments,
    activeEnrollments,
    totalRevenue,
    totalRevenueLabel: formatINR(totalRevenue),
    activeCourses: activeCoursesRaw,
    pendingOrders,
    totalOrders: orders.length,
    totalSessions,
    growth: {
      users: growthPct(usersThisMonth, usersLastMonth),
      enrollments: growthPct(enrollmentsThisMonth, enrollmentsLastMonth),
      revenue: growthPct(revenueThisMonth, revenueLastMonth),
      sessions: growthPct(sessionsThisMonth, sessionsLastMonth),
    },
    coursesNew: coursesThisMonth,
  };
}

// GET /api/admin/dashboard/stats
const getStats = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await buildStats() });
});

// GET /api/admin/dashboard - everything the dashboard page renders
const getDashboard = asyncHandler(async (_req, res) => {
  const stats = await buildStats();

  const [courses, enrollments, inquiries, activities] = await Promise.all([
    Course.find({}).sort({ studentsCount: -1 }).limit(4).lean(),
    Enrollment.find({}).sort({ createdAt: -1 }).limit(4).lean(),
    Inquiry.find({}).sort({ createdAt: -1 }).limit(4).lean(),
    Activity.find({}).sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  // Trend: REAL daily user signups + enrollments (no synthetic multipliers)
  const [userBuckets, enrollBuckets] = await Promise.all([
    User.aggregate([
      { $group: { _id: { $dateTrunc: { date: '$createdAt', unit: 'day' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]),
    Enrollment.aggregate([
      { $group: { _id: { $dateTrunc: { date: '$createdAt', unit: 'day' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]),
  ]);
  const fmtDay = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const trendByDay = new Map();
  for (const b of userBuckets) {
    const name = b._id ? fmtDay(b._id) : 'N/A';
    trendByDay.set(name, { name, users: b.count, enrollments: 0 });
  }
  for (const b of enrollBuckets) {
    const name = b._id ? fmtDay(b._id) : 'N/A';
    const row = trendByDay.get(name) || { name, users: 0, enrollments: 0 };
    row.enrollments = b.count;
    trendByDay.set(name, row);
  }
  const enrollmentTrend = Array.from(trendByDay.values()).sort(
    (a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()
  );

  const totalStudents = courses.reduce((s, c) => s + (c.studentsCount || 0), 0) || 1;
  const topCourses = courses.map((c) => ({
    id: c._id,
    name: c.name,
    enrollments: c.studentsCount || 0,
    percent: Math.round(((c.studentsCount || 0) / totalStudents) * 100),
  }));

  const recentEnrollments = enrollments.map((e) => ({ id: e._id, name: e.name, course: e.category, date: e.date }));
  const recentInquiries = inquiries.map((i) => ({ id: i._id, name: i.name, subject: i.category, status: i.status }));

  res.json({
    success: true,
    data: {
      stats: {
        ...stats,
        revenueDisplay: formatINR(stats.totalRevenue),
      },
      enrollmentTrend,
      topCourses,
      recentEnrollments,
      recentInquiries,
      recentActivities: activities.map((a) => ({ id: a._id, description: a.description, actor: a.actor, type: a.type, createdAt: a.createdAt })),
    },
  });
});

module.exports = { getDashboard, getStats };
