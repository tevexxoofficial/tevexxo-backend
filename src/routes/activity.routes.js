const express = require('express');
const { listActivity, recentActivity, activityStats } = require('../controllers/activity.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.get('/', listActivity);
router.get('/recent', recentActivity);
router.get('/stats', activityStats);

module.exports = router;
