const Category = require('../models/Category');
const generateSlug = require('../utils/generateSlug');
const deleteFile = require('../utils/deleteFile');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const query = req.query.all === 'true' ? {} : { isActive: true };
    const categories = await Category.find(query).sort({ sortOrder: 1, name: 1 });
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body;
    const slug = generateSlug(name);

    let image = '';
    if (req.file) {
      image = `/public/uploads/categories/${req.file.filename}`;
    }

    const category = await Category.create({
      name,
      slug,
      description,
      image,
      sortOrder: sortOrder || 0
    });

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, sortOrder, isActive } = req.body;
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục xe này.' });
    }

    let image = category.image;
    if (req.file) {
      deleteFile(category.image);
      image = `/public/uploads/categories/${req.file.filename}`;
    }

    const updateFields = {
      description,
      sortOrder,
      isActive,
      image
    };

    if (name) {
      updateFields.name = name;
      updateFields.slug = generateSlug(name);
    }

    category = await Category.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục xe này.' });
    }

    deleteFile(category.image);

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Đã xóa danh mục xe thành công.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
