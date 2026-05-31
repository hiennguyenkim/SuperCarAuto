const express = require('express');
const router = express.Router();
const {
  getCars,
  getCar,
  getCarBySlug,
  createCar,
  updateCar,
  deleteCar,
  updateCarStatus,
  updateCarFeatured
} = require('../controllers/carController');
const { requireAuth, requireStaff, requireAdmin } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getCars);
router.get('/:id', getCar);
router.get('/slug/:slug', getCarBySlug);

// Restricted routes
router.post('/', requireAuth, requireAdmin, upload.array('images', 10), createCar);
router.put('/:id', requireAuth, requireAdmin, upload.array('images', 10), updateCar);
router.delete('/:id', requireAuth, requireAdmin, deleteCar);
router.put('/:id/status', requireAuth, requireStaff, updateCarStatus);
router.put('/:id/featured', requireAuth, requireAdmin, updateCarFeatured);

module.exports = router;
