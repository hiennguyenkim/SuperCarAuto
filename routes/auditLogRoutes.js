const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditLog } = require('../controllers/auditLogController');
const { requireAuth, requireAdmin } = require('../middleware/roleMiddleware');

// Restricted entirely to administrators
router.use(requireAuth, requireAdmin);

router.get('/', getAuditLogs);
router.get('/:id', getAuditLog);

module.exports = router;
