const Collection = require('../models/Collection');
const generateSlug = require('../utils/generateSlug');
const deleteFile = require('../utils/deleteFile');

// @desc    Get active collections
// @route   GET /api/collections
// @access  Public
exports.getCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ isActive: true }).populate('cars');
    res.status(200).json({ success: true, count: collections.length, data: collections });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single collection by slug
// @route   GET /api/collections/:slug
// @access  Public
exports.getCollectionBySlug = async (req, res) => {
  try {
    const collection = await Collection.findOne({ slug: req.params.slug, isActive: true }).populate({
      path: 'cars',
      populate: ['brand', 'category']
    });

    if (!collection) {
      return res.status(404).json({ message: 'Không tìm thấy bộ sưu tập này.' });
    }

    res.status(200).json({ success: true, data: collection });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all collections (Admin)
// @route   GET /api/collections/admin/all
// @access  Private/Admin
exports.getAdminCollections = async (req, res) => {
  try {
    const collections = await Collection.find().populate('cars');
    res.status(200).json({ success: true, count: collections.length, data: collections });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create collection
// @route   POST /api/collections/admin
// @access  Private/Admin
exports.createCollection = async (req, res) => {
  try {
    const { name, description, cars } = req.body;
    const slug = generateSlug(name);

    let image = '';
    if (req.file) {
      image = `/public/uploads/collections/${req.file.filename}`;
    }

    let parsedCars = [];
    if (cars) {
      parsedCars = typeof cars === 'string' ? JSON.parse(cars) : cars;
    }

    const collection = await Collection.create({
      name,
      slug,
      description,
      image,
      cars: parsedCars
    });

    res.status(201).json({ success: true, data: collection });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update collection
// @route   PUT /api/collections/admin/:id
// @access  Private/Admin
exports.updateCollection = async (req, res) => {
  try {
    const { name, description, cars, isActive } = req.body;
    let collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: 'Không tìm thấy bộ sưu tập này.' });
    }

    let image = collection.image;
    if (req.file) {
      deleteFile(collection.image);
      image = `/public/uploads/collections/${req.file.filename}`;
    }

    const updateFields = {
      description,
      isActive,
      image
    };

    if (name) {
      updateFields.name = name;
      updateFields.slug = generateSlug(name);
    }

    if (cars) {
      updateFields.cars = typeof cars === 'string' ? JSON.parse(cars) : cars;
    }

    collection = await Collection.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: collection });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete collection
// @route   DELETE /api/collections/admin/:id
// @access  Private/Admin
exports.deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: 'Không tìm thấy bộ sưu tập này.' });
    }

    deleteFile(collection.image);

    await Collection.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Đã xóa bộ sưu tập thành công.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
