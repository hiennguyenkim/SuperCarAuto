const express = require('express');
const router = express.Router();
const { 
  createContactMessage, 
  getContactMessages, 
  updateStatus, 
  deleteContactMessage,
  createSupportMessage,
  getThread,
  replyToThread
} = require('../controllers/contactController');
const { requireAuth, requireStaff } = require('../middleware/roleMiddleware');

router.post('/', createContactMessage);
router.get('/', requireAuth, requireStaff, getContactMessages);
router.put('/:id/status', requireAuth, requireStaff, updateStatus);
router.delete('/:id', requireAuth, requireStaff, deleteContactMessage);

// CSKH Support Chat routes
router.post('/support', createSupportMessage);
router.get('/thread/:id', getThread);
router.post('/thread/:id/reply', requireAuth, requireStaff, replyToThread);

module.exports = router;
