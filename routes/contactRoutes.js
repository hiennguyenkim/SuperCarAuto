const express = require('express');
const router = express.Router();
const { createContactMessage, getContactMessages, updateStatus, deleteContactMessage } = require('../controllers/contactController');
const { requireAuth, requireStaff } = require('../middleware/roleMiddleware');

router.post('/', createContactMessage);
router.get('/', requireAuth, requireStaff, getContactMessages);
router.put('/:id/status', requireAuth, requireStaff, updateStatus);
router.delete('/:id', requireAuth, requireStaff, deleteContactMessage);

module.exports = router;
