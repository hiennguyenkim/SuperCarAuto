const Category = require('../models/Category');
const Car = require('../models/Car');
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
    console.error('Lỗi lấy danh mục:', err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc.' });
    }

    // Duplicate check (case-insensitive regex)
    const existing = await Category.findOne({ name: { $regex: new RegExp('^' + name.trim() + '$', 'i') } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Tên danh mục này đã tồn tại.' });
    }

    const slug = generateSlug(name.trim());

    let image = '';
    if (req.file) {
      image = `/public/uploads/categories/${req.file.filename}`;
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description ? description.trim() : '',
      image,
      sortOrder: sortOrder ? Number(sortOrder) : 0
    });

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    console.error('Lỗi tạo danh mục:', err);
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

    if (name && name.trim() !== category.name) {
      // Duplicate check (case-insensitive regex)
      const existing = await Category.findOne({
        name: { $regex: new RegExp('^' + name.trim() + '$', 'i') },
        _id: { $ne: req.params.id }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Tên danh mục này đã tồn tại.' });
      }
    }

    let image = category.image;
    if (req.file) {
      deleteFile(category.image);
      image = `/public/uploads/categories/${req.file.filename}`;
    }

    const updateFields = {
      description: description !== undefined ? description.trim() : category.description,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : category.sortOrder,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : category.isActive,
      image
    };

    if (name && name.trim() !== '') {
      updateFields.name = name.trim();
      updateFields.slug = generateSlug(name.trim());
    }

    category = await Category.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: category });
  } catch (err) {
    console.error('Lỗi cập nhật danh mục:', err);
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

    // Clean up uploaded files
    deleteFile(category.image);

    // Update referencing cars by removing the category link
    await Car.updateMany({ category: req.params.id }, { $unset: { category: 1 } });

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Đã xóa danh mục và cập nhật lại các xe liên quan thành công.' });
  } catch (err) {
    console.error('Lỗi xóa danh mục:', err);
    res.status(500).json({ message: err.message });
  }
};
