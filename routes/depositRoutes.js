const express = require('express');
const router = express.Router();
const {
  createDeposit,
  getDeposits,
  getMyDeposits,
  getDeposit,
  uploadPaymentProof,
  confirmDeposit,
  cancelDeposit,
  refundDeposit,
  convertToOrder
} = require('../controllers/depositController');
const { requireAuth, requireStaff, requireAdmin } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(requireAuth, createDeposit)
  .get(requireAuth, requireStaff, getDeposits);

router.get('/my-deposits', requireAuth, getMyDeposits);

router.route('/:id')
  .get(requireAuth, getDeposit);

router.post('/:id/payment-proof', requireAuth, upload.single('paymentProof'), uploadPaymentProof);
router.put('/:id/confirm', requireAuth, requireStaff, confirmDeposit);
router.put('/:id/cancel', requireAuth, requireStaff, cancelDeposit);
router.put('/:id/refund', requireAuth, requireAdmin, refundDeposit);
router.put('/:id/convert-to-order', requireAuth, requireStaff, convertToOrder);

module.exports = router;
