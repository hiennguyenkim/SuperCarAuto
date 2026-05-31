const express = require('express');
const router = express.Router();
const {
  getCollections,
  getCollectionBySlug,
  getAdminCollections,
  createCollection,
  updateCollection,
  deleteCollection
} = require('../controllers/collectionController');
const { requireAuth, requireAdmin } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getCollections);
router.get('/:slug', getCollectionBySlug);

// Admin routes
router.get('/admin/all', requireAuth, requireAdmin, getAdminCollections);
router.post('/admin', requireAuth, requireAdmin, upload.single('image'), createCollection);
router.put('/admin/:id', requireAuth, requireAdmin, upload.single('image'), updateCollection);
router.delete('/admin/:id', requireAuth, requireAdmin, deleteCollection);

module.exports = router;
