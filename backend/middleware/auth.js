const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/token');

// Verifies the JWT, then loads the user from the DB. Role and status always
// come from the database, never from the token or request body.
exports.protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = req.cookies?.token || (header?.startsWith('Bearer ') ? header.split(' ')[1] : null);
  if (!token) throw new AppError('Not authenticated', 401);

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('Account no longer exists', 401);
  if (user.status === 'blocked') throw new AppError('Your account has been blocked', 403);
  if (user.status !== 'active') throw new AppError('Your account is not active yet', 403);
  // Tokens issued before a password reset are no longer valid
  if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
    throw new AppError('Password changed. Please log in again.', 401);
  }

  req.user = user;
  next();
});

exports.authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to access this resource', 403));
  }
  next();
};

// Sets req.user when a valid token is present, but never rejects the request.
exports.optionalAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    const token = req.cookies?.token || (header?.startsWith('Bearer ') ? header.split(' ')[1] : null);
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);
      if (user && user.status === 'active'
        && !(user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime())) {
        req.user = user;
      }
    }
  } catch {
    /* ignore invalid tokens on public routes */
  }
  next();
};
