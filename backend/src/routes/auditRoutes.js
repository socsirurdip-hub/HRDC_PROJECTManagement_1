const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('super_admin'));
router.get('/', getAuditLogs);

module.exports = router;
