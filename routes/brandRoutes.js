const express = require('express');
const router = express.Router();
const { getBrands, getBrand, createBrand, updateBrand, deleteBrand } = require('../controllers/brandController');
const { requireAuth, requireAdmin } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getBrands)
  .post(requireAuth, requireAdmin, upload.single('logo'), createBrand);

router.route('/:id')
  .get(getBrand)
  .put(requireAuth, requireAdmin, upload.single('logo'), updateBrand)
  .delete(requireAuth, requireAdmin, deleteBrand);

module.exports = router;
