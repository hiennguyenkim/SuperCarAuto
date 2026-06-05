const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Initialize database connection
connectDB();

const app = express();

// Middleware setup
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static directories
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

// Route root access to homepage HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Import API routes
const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const brandRoutes = require('./routes/brandRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const testDriveRoutes = require('./routes/testDriveRoutes');
const depositRoutes = require('./routes/depositRoutes');
const orderRoutes = require('./routes/orderRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const financeRequestRoutes = require('./routes/financeRequestRoutes');
const accountRoutes = require('./routes/accountRoutes');
const couponRoutes = require('./routes/couponRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const contactRoutes = require('./routes/contactRoutes');
const siteSettingRoutes = require('./routes/siteSettingRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Bind API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/admin/categories', categoryRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/test-drives', testDriveRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/quote-requests', quoteRoutes);
app.use('/api/finance-requests', financeRequestRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact-message', contactRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/site-settings', siteSettingRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/stats', statsRoutes);

// Fallback views fallback (404 Page)
app.use((req, res, next) => {
  if (req.accepts('html')) {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
    return;
  }
  res.status(404).json({ message: 'Đường dẫn API này không tồn tại.' });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`
=================================================================
🏎️ [SuperCar Luxury System Local URLs]
- Trang chủ: http://localhost:${PORT}/
- Đăng nhập: http://localhost:${PORT}/views/login.html

🔑 [Tài khoản kiểm thử mẫu / Demo Accounts]
1. Tài khoản Quản Trị Viên (Admin):
   - Tài khoản: admin@supercarluxury.vn (hoặc 'admin')
   - Mật khẩu:  Admin@123

2. Tài khoản Nhân Viên (Staff):
   - Tài khoản: staff@supercarluxury.vn (hoặc 'staff')
   - Mật khẩu:  Staff@123

3. Tài khoản Khách Hàng (User):
   - Tài khoản: khach1@gmail.com (hoặc 'khach1')
   - Mật khẩu:  User@123
=================================================================
`);
});

