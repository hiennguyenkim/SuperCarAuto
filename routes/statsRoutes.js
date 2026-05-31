const express = require('express');
const router = express.Router();
const { getRevenueChart, getRevenueByCar } = require('../controllers/statsController');
const { requireAuth, requireStaff } = require('../middleware/roleMiddleware');

router.use(requireAuth, requireStaff);

router.get('/revenue-chart', getRevenueChart);
router.get('/by-car', getRevenueByCar);

module.exports = router;
