const mongoose = require('mongoose');
const Course = require('../models/Course');
const Program = require('../models/Program');
const Project = require('../models/Project');
const Testimonial = require('../models/Testimonial');
const Inquiry = require('../models/Inquiry');
const Setting = require('../models/Setting');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Statuses that mean "not ready for the public site" (case-insensitive)
const HIDDEN_STATUS_PATTERN = /(^|\s)(draft|pending|archived)(\s|$)/i;

function publicFilter() {
  return {
    $or: [
      { status: { $exists: false } },
      { status: null },
      { status: '' },
      { status: { $not: HIDDEN_STATUS_PATTERN } },
    ],
  };
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** GET /api/public/courses */
const listCourses = asyncHandler(async (_req, res) => {
  const docs = await Course.find(publicFilter()).sort({ createdAt: -1 });
  res.json({ success: true, count: docs.length, data: docs });
});

/** GET /api/public/courses/:id */
const getCourse = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid course id');
  const doc = await Course.findOne({ _id: req.params.id, ...publicFilter() });
  if (!doc) throw ApiError.notFound('Course not found');
  res.json({ success: true, data: doc });
});

/** GET /api/public/programs */
const listPrograms = asyncHandler(async (_req, res) => {
  const docs = await Program.find(publicFilter()).sort({ createdAt: -1 });
  res.json({ success: true, count: docs.length, data: docs });
});

/** GET /api/public/projects */
const listProjects = asyncHandler(async (_req, res) => {
  const docs = await Project.find(publicFilter()).sort({ createdAt: -1 });
  res.json({ success: true, count: docs.length, data: docs });
});

/** GET /api/public/projects/:idOrSlug - accepts Mongo _id or name-derived slug */
const getProject = asyncHandler(async (req, res) => {
  const key = String(req.params.idOrSlug || '').trim();
  if (!key) throw ApiError.badRequest('Project id or slug is required');

  let doc = null;
  if (mongoose.isValidObjectId(key)) {
    doc = await Project.findOne({ _id: key, ...publicFilter() });
  }
  if (!doc) {
    // Slug lookup without a stored slug field: match against slugified names.
    const candidates = await Project.find(publicFilter()).sort({ createdAt: -1 });
    doc = candidates.find((candidate) => slugify(candidate.name) === key.toLowerCase()) || null;
  }
  if (!doc) throw ApiError.notFound('Project not found');
  res.json({ success: true, data: doc });
});

/** GET /api/public/testimonials */
const listTestimonials = asyncHandler(async (_req, res) => {
  const docs = await Testimonial.find(publicFilter()).sort({ createdAt: -1 });
  res.json({ success: true, count: docs.length, data: docs });
});

/** GET /api/public/settings - public subset of the admin settings singleton */
const getPublicSettings = asyncHandler(async (_req, res) => {
  let settings = await Setting.findOne({ key: 'global' });
  if (!settings) settings = await Setting.create({ key: 'global' });
  const json = settings.toJSON();
  res.json({
    success: true,
    data: {
      siteName: json.siteName,
      siteEmail: json.siteEmail,
      siteDescription: json.siteDescription,
      currency: json.currency,
    },
  });
});

/** POST /api/public/inquiries - contact/demo form submissions from the landing site */
const createInquiry = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 200);
  const email = String(req.body.email || '').trim().toLowerCase().slice(0, 200);
  const phone = String(req.body.phone || '').trim().slice(0, 40);
  const category = String(req.body.category || 'General Inquiry').trim().slice(0, 100);
  const message = String(req.body.message || '').trim().slice(0, 2000);

  if (!name) throw ApiError.badRequest('Name is required');
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw ApiError.badRequest('A valid email is required');
  if (!message) throw ApiError.badRequest('Message is required');

  const doc = await Inquiry.create({
    name,
    email,
    category,
    status: 'Open',
    priority: 'Normal',
    message,
    detail: phone ? `Phone: ${phone}` : '',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  });

  res.status(201).json({ success: true, data: { id: doc._id.toString() } });
});

module.exports = {
  listCourses,
  getCourse,
  listPrograms,
  listProjects,
  getProject,
  listTestimonials,
  getPublicSettings,
  createInquiry,
};
