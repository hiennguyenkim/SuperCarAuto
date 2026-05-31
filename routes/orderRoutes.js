const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  confirmOrderPayment,
  completeOrder,
  cancelOrder
} = require('../controllers/orderController');
const { requireAuth, requireStaff } = require('../middleware/roleMiddleware');

router.route('/')
  .post(requireAuth, requireStaff, createOrder)
  .get(requireAuth, requireStaff, getOrders);

router.get('/my-orders', requireAuth, getMyOrders);

router.route('/:id')
  .get(requireAuth, getOrder);

router.put('/:id/status', requireAuth, requireStaff, updateOrderStatus);
router.put('/:id/confirm-payment', requireAuth, requireStaff, confirmOrderPayment);
router.put('/:id/complete', requireAuth, requireStaff, completeOrder);
router.put('/:id/cancel', requireAuth, requireStaff, cancelOrder);

module.exports = router;
