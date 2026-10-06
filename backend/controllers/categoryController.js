const { z } = require('zod');
const Category = require('../models/Category');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { PUBLIC_PRODUCT_STATUS: PUBLIC } = require('../utils/constants');
const { activeFarmerIds, slugify } = require('../utils/helpers');

exports.schema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).optional(),
  isActive: z.boolean().optional(),
});

exports.listPublic = asyncHandler(async (_req, res) => {
  const [cats, ids] = await Promise.all([Category.find({ isActive: true }).sort('name').lean(), activeFarmerIds()]);
  const counts = await Product.aggregate([
    { $match: { status: { $in: PUBLIC }, farmer: { $in: ids } } },
    { $group: { _id: '$category', n: { $sum: 1 } } },
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json({ success: true, data: cats.map((c) => ({ ...c, count: map.get(String(c._id)) || 0 })) });
});

exports.adminList = asyncHandler(async (_req, res) => {
  const [cats, counts] = await Promise.all([
    Category.find().sort('name').lean(),
    Product.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }]),
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json({ success: true, data: cats.map((c) => ({ ...c, count: map.get(String(c._id)) || 0 })) });
});

exports.create = asyncHandler(async (req, res) => {
  const cat = await Category.create({ ...req.body, slug: slugify(req.body.name) });
  res.status(201).json({ success: true, data: cat });
});

exports.update = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw new AppError('Category not found', 404);
  Object.assign(cat, req.body);
  if (req.body.name) cat.slug = slugify(req.body.name);
  await cat.save();
  res.json({ success: true, data: cat });
});

exports.remove = asyncHandler(async (req, res) => {
  if (await Product.exists({ category: req.params.id })) {
    throw new AppError('This category has products. Deactivate it instead of deleting.', 409);
  }
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) throw new AppError('Category not found', 404);
  res.json({ success: true, message: 'Category deleted' });
});
