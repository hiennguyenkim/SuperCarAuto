const express = require('express');
const router = express.Router();
const {
  createQuoteRequest,
  getQuoteRequests,
  getMyQuoteRequests,
  getQuoteRequest,
  updateQuoteRequestStatus
} = require('../controllers/quoteController');
const { requireAuth, requireStaff } = require('../middleware/roleMiddleware');

router.route('/')
  .post(requireAuth, createQuoteRequest)
  .get(requireAuth, requireStaff, getQuoteRequests);

router.get('/my-requests', requireAuth, getMyQuoteRequests);

router.route('/:id')
  .get(requireAuth, getQuoteRequest)
  .put(requireAuth, requireStaff, updateQuoteRequestStatus);

module.exports = router;
