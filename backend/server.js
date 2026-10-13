require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const required = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`);
  // Local-la mattum exit pannum. Vercel-la exit pannina "exit status 1" crash varum.
  if (!process.env.VERCEL) process.exit(1);
}

const app = express();

// Needed on Vercel / Render / Railway / Heroku, otherwise the Secure cookie is never set
app.set('trust proxy', 1);

// ---- middleware (ORDER MATTERS: these must come before the routes) ----
// CLIENT_URL = comma-separated frontend origin(s). Trailing "/" and spaces are stripped because
// the browser's Origin header NEVER has a trailing slash, so "https://x.vercel.app/" would never match.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    // no Origin header = curl / Postman / server-to-server -> allow
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    console.warn(`CORS blocked origin: ${origin} | allowed: ${allowedOrigins.join(', ') || '(none)'}`);
    return cb(null, false);
  },
  credentials: true, // REQUIRED for cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // answer preflight before anything else (DB, auth)
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ---- MongoDB (cached connection, serverless-ku mukkiyam) ----
let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI).then(async (m) => {
      // make sure the unique email index exists (the duplicate-email check relies on it)
      await require('./models/User').init();
      console.log('MongoDB connected');
      return m;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // next request-la retry aagum
    throw err;
  }
  return cached.conn;
}

// Health check DB-ku munnadiye work aagum (debug-ku useful)
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'API is running' }));

// Every other request-ku munnadi DB connect
app.use(async (_req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// ---- routes ----
app.use('/api/auth', require('./routes/authRoutes'));
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

// ---- start (local only) ----
// Vercel-la app.listen() podakoodadhu. Local-la mattum run aagum.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)))
    .catch((err) => {
      console.error('MongoDB connection failed:', err.message);
      process.exit(1);
    });
}

// Vercel-ku idhu dhaan "No exports found" error-ku main fix
module.exports = app;