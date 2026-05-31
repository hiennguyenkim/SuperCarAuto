const express = require('express');
const router = express.Router();
const { getCoupons, createCoupon, updateCoupon, deleteCoupon, applyCoupon } = require('../controllers/couponController');
const { requireAuth, requireStaff, requireAdmin } = require('../middleware/roleMiddleware');

router.post('/apply', requireAuth, applyCoupon);

router.route('/')
  .get(requireAuth, requireStaff, getCoupons)
  .post(requireAuth, requireAdmin, createCoupon);

router.route('/:id')
  .put(requireAuth, requireAdmin, updateCoupon)
  .delete(requireAuth, requireAdmin, deleteCoupon);

module.exports = router;
