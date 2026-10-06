const crypto = require('crypto');
const { z } = require('zod');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Client = require('../models/Client');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken, cookieOptions } = require('../utils/token');

// max(72) because bcrypt ignores everything after 72 bytes
// (renamed from `password` so it no longer clashes with the `password` variable in handlers)
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password needs a letter')
  .regex(/[0-9]/, 'Password needs a number');

// Only farmer/client can self-register. Admin accounts are created by the seed script.
exports.registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: passwordSchema,
    role: z.enum(['farmer', 'client'], { message: 'Role must be farmer or client' }),
    // optional, but if given it must look like a phone number. "" is allowed (treated as empty)
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s-]{10,15}$/, 'Enter a valid phone number')
      .optional()
      .or(z.literal('')),
    farmName: z.string().trim().min(2, 'Farm name must be at least 2 characters').optional(),
    location: z.string().trim().min(2, 'Location must be at least 2 characters').optional(),
  })
  .superRefine((d, ctx) => {
    if (d.role === 'farmer') {
      if (!d.farmName) ctx.addIssue({ code: 'custom', path: ['farmName'], message: 'Farm name is required' });
      if (!d.location) ctx.addIssue({ code: 'custom', path: ['location'], message: 'Location is required' });
    }
  });

exports.loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(72),
});
exports.forgotSchema = z.object({ email: z.string().trim().toLowerCase().email() });
exports.resetSchema = z.object({ password: passwordSchema });

// Never send password hash or reset tokens to the client.
const safeUser = (user) => {
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.passwordChangedAt;
  delete obj.__v;
  return obj;
};

// Token only goes in the httpOnly cookie, not in the JSON body.
const sendAuth = (res, user, status = 200) => {
  const token = signToken(user);
  res.cookie('token', token, cookieOptions());
  res.status(status).json({ success: true, user: safeUser(user) });
};

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, farmName, location } = req.body;
  const phone = req.body.phone || undefined; // "" -> undefined so empty strings are not stored

  // Friendly duplicate-email error
  if (await User.exists({ email })) {
    throw new AppError('Email already registered', 409);
  }

  // 1) create the user (password is hashed in the User model pre-save hook)
  let user;
  try {
    user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      status: role === 'farmer' ? 'pending' : 'active', // farmers need admin approval
    });
  } catch (err) {
    if (err.code === 11000) throw new AppError('Email already registered', 409); // race condition
    throw err;
  }

  // 2) create the role profile. If anything fails, roll back everything created so far.
  let clientId = null;
  try {
    if (role === 'farmer') {
      await Farmer.create({ user: user._id, farmName, location });

      // Notification failure must NOT fail the registration
      try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        if (admins.length) {
          await Notification.insertMany(
            admins.map((a) => ({
              user: a._id,
              type: 'account',
              title: 'New farmer registration',
              message: `${name} (${farmName}) is waiting for approval.`,
              link: '/admin/farmers',
            }))
          );
        }
      } catch (e) {
        console.error('Admin notification failed:', e.message);
      }
    } else {
      const client = await Client.create({ user: user._id });
      clientId = client._id;
      await Cart.create({ client: client._id, items: [] });
      await Wishlist.create({ client: client._id, products: [] });
    }
  } catch (err) {
    const cleanup = [
      Farmer.deleteOne({ user: user._id }),
      Client.deleteOne({ user: user._id }),
      User.findByIdAndDelete(user._id),
    ];
    if (clientId) {
      cleanup.push(Cart.deleteOne({ client: clientId }), Wishlist.deleteOne({ client: clientId }));
    }
    await Promise.allSettled(cleanup);
    throw err;
  }

  // 3) respond
  if (role === 'farmer') {
    // no cookie for farmers: they cannot log in until admin approves
    return res.status(201).json({
      success: true,
      message: 'Registration successful. Your account will be active once an admin approves it.',
      user: safeUser(user),
    });
  }
  return sendAuth(res, user, 201);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new AppError('Invalid email or password', 401);

  if (user.status === 'blocked') throw new AppError('Your account has been blocked. Contact support.', 403);
  if (user.status === 'pending') throw new AppError('Your account is awaiting admin approval.', 403);
  if (user.status === 'rejected') throw new AppError('Your registration was rejected.', 403);

  sendAuth(res, user);
});

// Clear the cookie with the SAME options used to set it (minus maxAge)
exports.logout = (_req, res) => {
  const { maxAge, expires, ...opts } = cookieOptions();
  res.clearCookie('token', opts);
  res.json({ success: true, message: 'Logged out' });
};

exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: safeUser(req.user) });
});

// Always returns the same response so emails can't be enumerated.
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const raw = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(raw).digest('hex');
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const link = `${process.env.CLIENT_URL}/reset-password/${raw}`;
    // TODO: send this link by email (Resend / Nodemailer) before deploying.
    if (process.env.NODE_ENV !== 'production') console.log(`[DEV] Password reset link for ${user.email}: ${link}`);
  }
  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires');
  if (!user) throw new AppError('Reset link is invalid or has expired', 400);

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  // invalidate old JWTs (checked in middleware/auth.js)
  user.passwordChangedAt = new Date(Date.now() - 1000);
  await user.save();
  res.json({ success: true, message: 'Password updated. You can now log in.' });
});