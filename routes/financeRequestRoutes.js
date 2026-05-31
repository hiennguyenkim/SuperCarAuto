const express = require('express');
const router = express.Router();
const {
  createFinanceRequest,
  getFinanceRequests,
  getMyFinanceRequests,
  getFinanceRequest,
  updateFinanceRequestStatus
} = require('../controllers/financeRequestController');
const { requireAuth, requireStaff } = require('../middleware/roleMiddleware');

router.route('/')
  .post(requireAuth, createFinanceRequest)
  .get(requireAuth, requireStaff, getFinanceRequests);

router.get('/my-requests', requireAuth, getMyFinanceRequests);

router.route('/:id')
  .get(requireAuth, getFinanceRequest)
  .put(requireAuth, requireStaff, updateFinanceRequestStatus);

module.exports = router;
