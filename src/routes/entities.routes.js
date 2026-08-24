const express = require('express');
const { crudRouter } = require('./crud.router');
const users = require('../controllers/users.controller');
const courses = require('../controllers/courses.controller');
const programs = require('../controllers/programs.controller');
const projects = require('../controllers/projects.controller');
const enrollments = require('../controllers/enrollments.controller');
const orders = require('../controllers/orders.controller');
const inquiries = require('../controllers/contacts.controller');
const blog = require('../controllers/blog.controller');
const testimonials = require('../controllers/testimonials.controller');
const mentors = require('../controllers/mentors.controller');

const router = express.Router();

// CONTACTS alias -> same handler set as inquiries (contact messages)
router.use('/users', crudRouter(users));
router.use('/courses', crudRouter(courses));
router.use('/programs', crudRouter(programs));
router.use('/projects', crudRouter(projects));
router.use('/enrollments', crudRouter(enrollments));
router.use('/orders', crudRouter(orders));
router.use('/contacts', crudRouter(inquiries));
router.use('/inquiries', crudRouter(inquiries)); // frontend page key
router.use('/blog', crudRouter(blog));
router.use('/testimonials', crudRouter(testimonials));
router.use('/mentors', crudRouter(mentors));

module.exports = router;
