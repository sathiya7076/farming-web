require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const required = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];
required.forEach((k) => {
  if (!process.env[k]) {
    console.error(`Missing ${k} in .env`);
    process.exit(1);
  }
});

const app = express();

// Needed on Render / Railway / Heroku, otherwise the Secure cookie is never set
app.set('trust proxy', 1);

// ---- middleware (ORDER MATTERS: these must come before the routes) ----
app.use(
  cors({
    origin: process.env.CLIENT_URL.split(',').map((s) => s.trim()), // exact origin(s), NOT '*'
    credentials: true, // REQUIRED for cookies
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ---- routes ----
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'API is running' }));
app.use('/api/auth', require('./routes/authRoutes'));
// ADDED: other routes
// ADDED: other routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/farmers', require('./routes/farmerRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/notifications', require('./routes/Notificationroutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// ---- 404 ----
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ---- error handler (must be last) ----
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Server error';

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON in request body';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Duplicate value. That record already exists.';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id';
  }

  if (status >= 500) console.error(err);
  res.status(status).json({
    success: false,
    message: status >= 500 && process.env.NODE_ENV === 'production' ? 'Server error' : message,
  });
});

// ---- start ----
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    // make sure the unique email index exists (the duplicate-email check relies on it)
    await require('./models/User').init();
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });