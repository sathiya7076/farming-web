const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Client = require('../models/Client');
const AppError = require('./AppError');

exports.escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
exports.isId = (v) => /^[a-f\d]{24}$/i.test(String(v || ''));
exports.slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
exports.platformFee = () => Number(process.env.PLATFORM_FEE_PERCENT ?? 5);

exports.paginate = (query, defLimit = 10, max = 50) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defLimit, 1), max);
  return { page, limit, skip: (page - 1) * limit };
};
exports.pageMeta = (page, limit, total) => ({ page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) });

// Farmers whose account is active (blocked/pending farmers' products are hidden publicly)
exports.activeFarmerIds = async () => {
  const users = await User.find({ role: 'farmer', status: 'active' }).distinct('_id');
  return Farmer.find({ user: { $in: users } }).distinct('_id');
};

exports.farmerOf = async (user) => {
  const f = await Farmer.findOne({ user: user._id });
  if (!f) throw new AppError('Farmer profile not found', 404);
  return f;
};
exports.clientOf = async (user) => {
  const c = await Client.findOne({ user: user._id });
  if (!c) throw new AppError('Client profile not found', 404);
  return c;
};
