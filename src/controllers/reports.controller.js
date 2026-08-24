const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Order = require('../models/Order');
const Mentor = require('../models/Mentor');
const Activity = require('../models/Activity');
const asyncHandler = require('../utils/asyncHandler');
const { streamTablePdf } = require('../utils/pdfReport');

const stamp = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => (d ? new Date(d).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '');
const pdfName = (kind) => `Tevexxo-${kind}-Report-${stamp()}.pdf`;

// GET /api/admin/reports/users
exports.userReport = asyncHandler(async (_req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  streamTablePdf(res, {
    filename: pdfName('User'),
    title: 'User Report',
    subtitle: `${users.length} registered users`,
    columns: [
      { header: 'Name', width: 150, value: (u) => u.name },
      { header: 'Email', width: 220, value: (u) => u.email },
      { header: 'Role', width: 110, value: (u) => u.role || '' },
      { header: 'Status', width: 90, value: (u) => u.status || '' },
      { header: 'Joined', width: 130, value: (u) => fmtDate(u.createdAt) },
    ],
    rows: users,
  });
});

// GET /api/admin/reports/enrollments
exports.enrollmentReport = asyncHandler(async (_req, res) => {
  const [rows, totalUsers, totalCourses, activeEnrollments] = await Promise.all([
    Enrollment.find({}).sort({ createdAt: -1 }).lean(),
    User.countDocuments({}),
    Course.countDocuments({}),
    Enrollment.countDocuments({ status: 'Active' }),
  ]);
  streamTablePdf(res, {
    filename: pdfName('Enrollment'),
    title: 'Enrollment Report',
    subtitle: `${rows.length} enrollment records`,
    summary: [
      { label: 'Total Users', value: totalUsers },
      { label: 'Total Courses', value: totalCourses },
      { label: 'Total Enrollments', value: rows.length },
      { label: 'Active Enrollments', value: activeEnrollments },
    ],
    columns: [
      { header: 'Student', width: 140, value: (e) => e.name },
      { header: 'Email', width: 200, value: (e) => e.email },
      { header: 'Course', width: 150, value: (e) => e.category },
      { header: 'Progress %', width: 70, align: 'right', value: (e) => (typeof e.progress === 'number' ? e.progress : '') },
      { header: 'Status', width: 80, value: (e) => e.status },
      { header: 'Enrolled At', width: 130, value: (e) => fmtDate(e.createdAt) },
    ],
    rows,
  });
});

// GET /api/admin/reports/revenue
exports.revenueReport = asyncHandler(async (_req, res) => {
  const rows = await Order.find({}).sort({ createdAt: -1 }).lean();
  const paid = rows.filter((o) => o.status !== 'Refunded');
  streamTablePdf(res, {
    filename: pdfName('Revenue'),
    title: 'Revenue Report',
    subtitle: `${rows.length} orders`,
    summary: [
      { label: 'Total Orders', value: rows.length },
      { label: 'Paid Orders', value: paid.length },
      { label: 'Pending Orders', value: rows.filter((o) => o.status === 'Pending').length },
    ],
    columns: [
      { header: 'Order ID', width: 100, value: (o) => o.name },
      { header: 'Customer', width: 160, value: (o) => o.category },
      { header: 'Email', width: 180, value: (o) => o.email },
      { header: 'Amount', width: 90, align: 'right', value: (o) => o.amount },
      { header: 'Payment Method', width: 110, value: (o) => o.detail },
      { header: 'Status', width: 80, value: (o) => o.status },
      { header: 'Date', width: 120, value: (o) => fmtDate(o.createdAt) },
    ],
    rows,
  });
});

// GET /api/admin/reports/courses
exports.courseReport = asyncHandler(async (_req, res) => {
  const rows = await Course.find({}).sort({ createdAt: -1 }).lean();
  streamTablePdf(res, {
    filename: pdfName('Course'),
    title: 'Course Report',
    subtitle: `${rows.length} courses`,
    columns: [
      { header: 'Name', width: 190, value: (c) => c.name },
      { header: 'Category', width: 150, value: (c) => c.category },
      { header: 'Students', width: 70, align: 'right', value: (c) => (typeof c.studentsCount === 'number' ? c.studentsCount : '') },
      { header: 'Price', width: 90, align: 'right', value: (c) => c.amount },
      { header: 'Status', width: 90, value: (c) => c.status },
      { header: 'Created', width: 130, value: (c) => fmtDate(c.createdAt) },
    ],
    rows,
  });
});

// GET /api/admin/reports/mentors
exports.mentorReport = asyncHandler(async (_req, res) => {
  const rows = await Mentor.find({}).sort({ createdAt: -1 }).lean();
  streamTablePdf(res, {
    filename: pdfName('Mentor'),
    title: 'Mentor Report',
    subtitle: `${rows.length} mentors`,
    columns: [
      { header: 'Name', width: 150, value: (m) => m.name },
      { header: 'Email', width: 210, value: (m) => m.email },
      { header: 'Expertise', width: 160, value: (m) => m.category },
      { header: 'Details', width: 170, value: (m) => m.detail },
      { header: 'Status', width: 80, value: (m) => m.status },
      { header: 'Joined', width: 120, value: (m) => fmtDate(m.createdAt) },
    ],
    rows,
  });
});

// GET /api/admin/reports/engagement
exports.engagementReport = asyncHandler(async (_req, res) => {
  const rows = await Activity.find({}).sort({ createdAt: -1 }).limit(1000).lean();
  streamTablePdf(res, {
    filename: pdfName('Engagement'),
    title: 'Engagement Report',
    subtitle: `${rows.length} platform events`,
    columns: [
      { header: 'When', width: 120, value: (a) => fmtDate(a.createdAt) },
      { header: 'Actor', width: 110, value: (a) => a.actor },
      { header: 'Type', width: 140, value: (a) => a.type },
      { header: 'Entity', width: 100, value: (a) => a.entity },
      { header: 'Description', width: 300, value: (a) => a.description },
    ],
    rows,
  });
});
