const express = require('express');
const { listAuditLogs, getAuditLog } = require('../controllers/auditLogs.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.get('/', listAuditLogs);
router.get('/:id', getAuditLog);

module.exports = router;
