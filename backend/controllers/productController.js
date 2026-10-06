const { z } = require('zod');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Farmer = require('../models/Farmer');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { PUBLIC_PRODUCT_STATUS: PUBLIC, PRODUCT_STATUS, UNITS } = require('../utils/constants');
const { escapeRegex, isId, paginate, pageMeta, activeFarmerIds, farmerOf } = require('../utils/helpers');
const { uploadImages, deleteImages } = require('../services/imageService');
const { notify, notifyMany } = require('../utils/notify');

const populateProduct = [
  { path: 'category', select: 'name slug' },
  { path: 'farmer', select: 'farmName location bio ratingAvg ratingCount user', populate: { path: 'user', select: 'name' } },
];

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const base = {
  name: z.string().trim().min(2).max(120),
  category: objectId,
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
  price: z.coerce.number().positive('Price must be greater than 0'),
  quantity: z.coerce.number().min(0, 'Quantity cannot be negative'),
  unit: z.enum(UNITS).default('kg'),
  location: z.string().trim().min(2),
  harvestDate: z.coerce.date(),
};
exports.createSchema = z.object(base);
exports.updateSchema = z.object(base).partial().extend({
  removeImages: z.preprocess((v) => {
    if (typeof v !== 'string') return v;
    try { return JSON.parse(v); } catch { return []; }
  }, z.array(z.string()).optional()),
});
exports.statusSchema = z.object({ status: z.enum(PRODUCT_STATUS), reason: z.string().trim().max(300).optional() });

const assertOwnerOrAdmin = async (user, product) => {
  if (user.role === 'admin') return;
  const f = await Farmer.findOne({ user: user._id });
  if (!f || String(f._id) !== String(product.farmer)) throw new AppError('You can only manage your own products', 403);
};

// ---------- public ----------
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 12);
  const { q, category, location, minPrice, maxPrice, sort, farmer, featured } = req.query;
  const ids = await activeFarmerIds();
  const filter = { status: { $in: PUBLIC }, farmer: { $in: ids } };

  if (farmer && isId(farmer)) filter.farmer = { $in: ids.filter((i) => String(i) === farmer) };
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { description: rx }, { location: rx }];
  }
  if (location) filter.location = new RegExp(escapeRegex(location), 'i');
  if (category) {
    const c = await Category.findOne(isId(category) ? { _id: category } : { slug: category }).select('_id');
    filter.category = c ? c._id : null;
  }
  const min = Number(minPrice), max = Number(maxPrice);
  if (Number.isFinite(min) && minPrice !== '') filter.price = { ...filter.price, $gte: min };
  if (Number.isFinite(max) && maxPrice !== '') filter.price = { ...filter.price, $lte: max };
  if (featured === 'true') filter.featured = true;

  const sorts = {
    latest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { ratingAvg: -1, ratingCount: -1 },
  };
  const [data, total] = await Promise.all([
    Product.find(filter).populate(populateProduct).sort(sorts[sort] || sorts.latest).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: pageMeta(page, limit, total) });
});

exports.locations = asyncHandler(async (_req, res) => {
  const data = await Product.distinct('location', { status: { $in: PUBLIC } });
  res.json({ success: true, data: data.sort() });
});

exports.getOne = asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id).populate(populateProduct);
  if (!p) throw new AppError('Product not found', 404);

  let allowed = false;
  if (PUBLIC.includes(p.status)) {
    allowed = !!(await User.exists({ _id: p.farmer.user._id, status: 'active' }));
  }
  if (!allowed && req.user) {
    if (req.user.role === 'admin') allowed = true;
    else if (req.user.role === 'farmer') {
      const f = await Farmer.findOne({ user: req.user._id });
      allowed = !!f && String(f._id) === String(p.farmer._id);
    }
  }
  if (!allowed) throw new AppError('Product not found', 404);
  res.json({ success: true, data: p });
});

// ---------- farmer ----------
exports.mine = asyncHandler(async (req, res) => {
  const farmer = await farmerOf(req.user);
  const { page, limit, skip } = paginate(req.query, 10);
  const filter = { farmer: farmer._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) filter.name = new RegExp(escapeRegex(req.query.q), 'i');
  const [data, total] = await Promise.all([
    Product.find(filter).populate('category', 'name').sort('-createdAt').skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: pageMeta(page, limit, total) });
});

exports.create = asyncHandler(async (req, res) => {
  const farmer = await farmerOf(req.user);
  const files = req.files || [];
  if (!files.length) throw new AppError('Upload at least one product image', 400);
  const cat = await Category.findOne({ _id: req.body.category, isActive: true });
  if (!cat) throw new AppError('Invalid category', 400);

  const images = await uploadImages(files);
  let product;
  try {
    product = await Product.create({ ...req.body, farmer: farmer._id, images, status: 'Pending' });
  } catch (e) {
    await deleteImages(images);
    throw e;
  }
  const admins = await User.find({ role: 'admin' }).distinct('_id');
  await notifyMany(admins, 'Product awaiting approval', `${farmer.farmName} added "${product.name}".`, 'product', '/admin/products');
  res.status(201).json({ success: true, data: product });
});

exports.update = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  await assertOwnerOrAdmin(req.user, product);

  const { removeImages = [], ...fields } = req.body;
  if (fields.category && !(await Category.exists({ _id: fields.category }))) throw new AppError('Invalid category', 400);

  const toRemove = product.images.filter((i) => removeImages.includes(i.publicId) || removeImages.includes(i.url));
  const remaining = product.images.filter((i) => !toRemove.includes(i));
  const files = req.files || [];
  if (remaining.length + files.length > 5) throw new AppError('A product can have at most 5 images', 400);
  if (remaining.length + files.length < 1) throw new AppError('A product needs at least one image', 400);

  const added = await uploadImages(files);
  Object.assign(product, fields);
  product.images = [...remaining, ...added];

  if (req.user.role === 'farmer' && product.status === 'Rejected') {
    product.status = 'Pending'; // re-submit for approval after fixing
    product.rejectionReason = undefined;
  }
  if (PUBLIC.includes(product.status) || product.status === 'Out of Stock') {
    if (product.quantity <= 0) product.status = 'Out of Stock';
    else if (product.status === 'Out of Stock') product.status = 'Available';
  }
  try {
    await product.save();
  } catch (e) {
    await deleteImages(added);
    throw e;
  }
  await deleteImages(toRemove);
  res.json({ success: true, data: product });
});

exports.remove = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  await assertOwnerOrAdmin(req.user, product);

  await deleteImages(product.images); // remove from Cloudinary
  await Promise.all([
    Product.deleteOne({ _id: product._id }),
    Cart.updateMany({}, { $pull: { items: { product: product._id } } }),
    Wishlist.updateMany({}, { $pull: { products: product._id } }),
    Review.deleteMany({ product: product._id }),
  ]);
  res.json({ success: true, message: 'Product deleted' });
});

// ---------- admin ----------
exports.adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 10);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) filter.name = new RegExp(escapeRegex(req.query.q), 'i');
  const [data, total, counts] = await Promise.all([
    Product.find(filter).populate(populateProduct).sort('-createdAt').skip(skip).limit(limit),
    Product.countDocuments(filter),
    Product.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  res.json({
    success: true,
    data,
    pagination: pageMeta(page, limit, total),
    counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
  });
});

exports.adminSetStatus = asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id).populate('farmer', 'user');
  if (!p) throw new AppError('Product not found', 404);
  const { status, reason } = req.body;

  if (status === 'Approved' || status === 'Available') p.status = p.quantity > 0 ? 'Available' : 'Out of Stock';
  else p.status = status;
  p.rejectionReason = status === 'Rejected' ? reason || 'Does not meet our listing guidelines' : undefined;
  await p.save();

  const msg =
    status === 'Rejected'
      ? `"${p.name}" was rejected. Reason: ${p.rejectionReason}`
      : `"${p.name}" is now ${p.status}.`;
  await notify(p.farmer.user, 'Product update', msg, 'product', '/farmer/products');
  res.json({ success: true, data: p });
});
