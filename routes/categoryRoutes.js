const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { requireAuth, requireAdmin } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getCategories)
  .post(requireAuth, requireAdmin, upload.single('image'), createCategory);

router.route('/:id')
  .put(requireAuth, requireAdmin, upload.single('image'), updateCategory)
  .delete(requireAuth, requireAdmin, deleteCategory);

module.exports = router;
