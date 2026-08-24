const express = require('express');
const controller = require('../controllers/public.controller');

const router = express.Router();

// Public, read-only content endpoints for the Main Tevexxo Landing Website.
// No authentication required; mutations are NOT exposed here (except the
// validated public inquiry form submission).
router.get('/courses', controller.listCourses);
router.get('/courses/:id', controller.getCourse);
router.get('/programs', controller.listPrograms);
router.get('/projects', controller.listProjects);
router.get('/projects/:idOrSlug', controller.getProject);
router.get('/testimonials', controller.listTestimonials);
router.get('/settings', controller.getPublicSettings);
router.post('/inquiries', controller.createInquiry);

module.exports = router;
