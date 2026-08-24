const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settings.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;
