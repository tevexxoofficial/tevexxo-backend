const express = require('express');
const {
  userReport,
  enrollmentReport,
  revenueReport,
  courseReport,
  mentorReport,
  engagementReport,
} = require('../controllers/reports.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.get('/users', userReport);
router.get('/enrollments', enrollmentReport);
router.get('/revenue', revenueReport);
router.get('/courses', courseReport);
router.get('/mentors', mentorReport);
router.get('/engagement', engagementReport);

module.exports = router;
