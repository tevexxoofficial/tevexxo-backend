const express = require('express');
const { getDashboard, getStats } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.get('/', getDashboard);
router.get('/stats', getStats);

module.exports = router;
