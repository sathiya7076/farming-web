const { z } = require('zod');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { farmerOf, clientOf } = require('../utils/helpers');

const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password needs a letter')
  .regex(/[0-9]/, 'Password needs a number');

exports.updateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  farmName: z.string().trim().min(2).optional(),
  location: z.string().trim().min(2).optional(),
  bio: z.string().trim().max(1000).optional(),
  farmSize: z.string().trim().max(60).optional(),
  experienceYears: z.coerce.number().min(0).max(80).optional(),
  specialties: z
    .union([z.array(z.string()), z.string()])
    .transform((v) => (Array.isArray(v) ? v : v.split(',')).map((s) => s.trim()).filter(Boolean))
    .optional(),
});
exports.addressSchema = z.object({
  label: z.string().trim().max(30).optional(),
  fullName: z.string().trim().min(2),
  phone: z.string().trim().min(7),
  line1: z.string().trim().min(3),
  city: z.string().trim().min(2),
  state: z.string().trim().optional(),
  pincode: z.string().trim().optional(),
});
exports.passwordSchema = z.object({ currentPassword: z.string().min(1), newPassword: strongPassword });

const loadProfile = async (user) => {
  if (user.role === 'farmer') return Farmer.findOne({ user: user._id });
  if (user.role === 'client') return clientOf(user);
  return null;
};

exports.get = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user, profile: await loadProfile(req.user) } });
});

exports.update = asyncHandler(async (req, res) => {
  const { name, phone, ...rest } = req.body;
  const userUpdate = {};
  if (name) userUpdate.name = name;
  if (phone !== undefined) userUpdate.phone = phone;
  const user = Object.keys(userUpdate).length
    ? await User.findByIdAndUpdate(req.user._id, userUpdate, { new: true, runValidators: true })
    : req.user;

  let profile = null;
  if (user.role === 'farmer') {
    const f = await farmerOf(user);
    ['farmName', 'location', 'bio', 'farmSize', 'experienceYears', 'specialties'].forEach((k) => {
      if (rest[k] !== undefined) f[k] = rest[k];
    });
    profile = await f.save();
  } else profile = await loadProfile(user);
  res.json({ success: true, data: { user, profile } });
});

exports.addAddress = asyncHandler(async (req, res) => {
  const client = await clientOf(req.user);
  client.addresses.push({ ...req.body, isDefault: client.addresses.length === 0 });
  await client.save();
  res.status(201).json({ success: true, data: client });
});

exports.removeAddress = asyncHandler(async (req, res) => {
  const client = await clientOf(req.user);
  const addr = client.addresses.id(req.params.addressId);
  if (!addr) throw new AppError('Address not found', 404);
  addr.deleteOne();
  await client.save();
  res.json({ success: true, data: client });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) throw new AppError('Current password is incorrect', 400);
  user.password = req.body.newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
});
