const { z } = require('zod');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Client = require('../models/Client');
const Farmer = require('../models/Farmer');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { ORDER_STATUS, ORDER_TRANSITIONS, PAYMENT_METHODS, PUBLIC_PRODUCT_STATUS: PUBLIC } = require('../utils/constants');
const { escapeRegex, paginate, pageMeta, activeFarmerIds, clientOf, farmerOf } = require('../utils/helpers');
const { populateOrder } = require('../utils/populate');
const { notify } = require('../utils/notify');

const addressZ = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().trim().min(7),
  line1: z.string().trim().min(3),
  city: z.string().trim().min(2),
  state: z.string().trim().optional(),
  pincode: z.string().trim().optional(),
});
exports.createSchema = z
  .object({
    paymentMethod: z.enum(PAYMENT_METHODS),
    addressId: z.string().optional(),
    address: addressZ.optional(),
    saveAddress: z.boolean().optional(),
  })
  .refine((d) => d.addressId || d.address, { message: 'Delivery address is required', path: ['address'] });
exports.statusSchema = z.object({ status: z.enum(ORDER_STATUS) });

const restoreStock = async (items) => {
  for (const it of items) {
    const p = await Product.findByIdAndUpdate(it.product, { $inc: { quantity: it.quantity } }, { new: true });
    if (p && p.status === 'Out of Stock' && p.quantity > 0) {
      p.status = 'Available';
      await p.save();
    }
  }
};

// Confirms the current user may see/act on this order and returns the owner profiles.
const assertAccess = async (order, user) => {
  if (user.role === 'admin') return;
  if (user.role === 'farmer') {
    const f = await Farmer.findOne({ user: user._id });
    if (f && String(f._id) === String(order.farmer)) return;
  }
  if (user.role === 'client') {
    const c = await Client.findOne({ user: user._id });
    if (c && String(c._id) === String(order.client)) return;
  }
  throw new AppError('Order not found', 404); // don't reveal other users' orders
};

// ---------- place order (client) ----------
exports.create = asyncHandler(async (req, res) => {
  const client = await clientOf(req.user);
  const cart = await Cart.findOne({ client: client._id }).populate('items.product');
  const items = (cart?.items || []).filter((i) => i.product);
  if (!items.length) throw new AppError('Your cart is empty', 400);

  let address = req.body.address;
  if (req.body.addressId) {
    const a = client.addresses.id(req.body.addressId);
    if (!a) throw new AppError('Saved address not found', 404);
    address = { fullName: a.fullName, phone: a.phone, line1: a.line1, city: a.city, state: a.state, pincode: a.pincode };
  }

  const activeIds = (await activeFarmerIds()).map(String);
  const groups = new Map();
  for (const it of items) {
    const p = it.product;
    if (!PUBLIC.includes(p.status) || p.quantity < 1 || !activeIds.includes(String(p.farmer))) {
      throw new AppError(`"${p.name}" is no longer available. Please remove it from your cart.`, 409);
    }
    if (it.quantity > p.quantity) throw new AppError(`Only ${p.quantity} ${p.unit} of "${p.name}" left`, 409);
    const k = String(p.farmer);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(it);
  }

  // Reserve stock atomically per item; roll back everything if one fails.
  const reserved = [];
  try {
    for (const it of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: it.product._id, quantity: { $gte: it.quantity }, status: { $in: PUBLIC } },
        { $inc: { quantity: -it.quantity } },
        { new: true }
      );
      if (!updated) throw new AppError(`"${it.product.name}" just sold out or has less stock now`, 409);
      reserved.push({ product: it.product._id, quantity: it.quantity });
      if (updated.quantity === 0) {
        updated.status = 'Out of Stock';
        await updated.save();
      }
    }
  } catch (e) {
    await restoreStock(reserved);
    throw e;
  }

  const online = req.body.paymentMethod === 'MockOnline';
  const orders = [];
  for (const [farmerId, list] of groups) {
    const orderItems = list.map((it) => ({
      product: it.product._id,
      name: it.product.name,
      image: it.product.images?.[0]?.url,
      unit: it.product.unit,
      price: it.product.price,
      quantity: it.quantity,
    }));
    const total = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const order = await Order.create({
      client: client._id,
      farmer: farmerId,
      items: orderItems,
      totalAmount: total,
      deliveryAddress: address,
      paymentMethod: req.body.paymentMethod,
      paymentStatus: online ? 'Paid' : 'Pending',
      statusHistory: [{ status: 'Pending', by: req.user._id }],
    });
    await Payment.create({
      order: order._id,
      client: client._id,
      farmer: farmerId,
      amount: total,
      method: req.body.paymentMethod,
      status: online ? 'Paid' : 'Pending',
      transactionId: online ? 'MOCK-' + Date.now().toString(36).toUpperCase() : undefined,
      paidAt: online ? new Date() : undefined,
    });
    const farmer = await Farmer.findById(farmerId);
    await notify(farmer.user, 'New order received', `Order ${order.orderId} (₹${total}) is waiting for your response.`, 'order', '/farmer/orders');
    orders.push(order);
  }

  cart.items = [];
  await cart.save();
  if (req.body.saveAddress && req.body.address) {
    client.addresses.push({ ...req.body.address, isDefault: client.addresses.length === 0 });
    await client.save();
  }
  await notify(
    req.user._id,
    'Order placed',
    orders.length > 1 ? `${orders.length} orders were placed (one per farmer).` : `Order ${orders[0].orderId} was placed successfully.`,
    'order',
    '/client/orders'
  );
  res.status(201).json({ success: true, data: orders });
});

// ---------- list (role scoped) ----------
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 10);
  const filter = {};
  if (req.user.role === 'farmer') filter.farmer = (await farmerOf(req.user))._id;
  if (req.user.role === 'client') filter.client = (await clientOf(req.user))._id;

  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) filter.orderId = new RegExp(escapeRegex(req.query.q), 'i');
  if (req.query.from || req.query.to) {
    filter.orderDate = {};
    if (req.query.from) filter.orderDate.$gte = new Date(req.query.from);
    if (req.query.to) filter.orderDate.$lte = new Date(new Date(req.query.to).getTime() + 864e5 - 1);
  }
  const [data, total] = await Promise.all([
    populateOrder(Order.find(filter).sort('-orderDate').skip(skip).limit(limit)),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: pageMeta(page, limit, total) });
});

exports.summary = asyncHandler(async (req, res) => {
  const match = {};
  if (req.user.role === 'farmer') match.farmer = (await farmerOf(req.user))._id;
  if (req.user.role === 'client') match.client = (await clientOf(req.user))._id;
  const rows = await Order.aggregate([
    { $match: match },
    { $group: { _id: '$status', n: { $sum: 1 }, amount: { $sum: '$totalAmount' } } },
  ]);
  const byStatus = Object.fromEntries(rows.map((r) => [r._id, r.n]));
  res.json({ success: true, data: { total: rows.reduce((s, r) => s + r.n, 0), byStatus } });
});

exports.getOne = asyncHandler(async (req, res) => {
  const order = await populateOrder(Order.findById(req.params.id));
  if (!order) throw new AppError('Order not found', 404);
  await assertAccess({ farmer: order.farmer._id, client: order.client._id }, req.user);
  const payment = await Payment.findOne({ order: order._id });
  res.json({ success: true, data: { order, payment } });
});

// ---------- status workflow ----------
exports.updateStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  await assertAccess(order, req.user);

  const next = req.body.status;
  const allowedRoles = ORDER_TRANSITIONS[order.status]?.[next];
  if (!allowedRoles) throw new AppError(`Cannot change an order from ${order.status} to ${next}`, 400);
  if (!allowedRoles.includes(req.user.role)) throw new AppError('You are not allowed to make this change', 403);

  order.status = next;
  order.statusHistory.push({ status: next, by: req.user._id });

  if (next === 'Delivered') {
    order.deliveryDate = new Date();
    if (order.paymentMethod === 'COD') {
      order.paymentStatus = 'Paid';
      await Payment.updateOne({ order: order._id }, { status: 'Paid', paidAt: new Date() });
    }
  }
  if (next === 'Rejected' || next === 'Cancelled') {
    await restoreStock(order.items);
    if (order.paymentStatus === 'Paid') {
      order.paymentStatus = 'Refunded';
      await Payment.updateOne({ order: order._id }, { status: 'Refunded' });
    } else {
      order.paymentStatus = 'Failed';
      await Payment.updateOne({ order: order._id }, { status: 'Failed' });
    }
  }
  await order.save();

  // notify the other side(s)
  const [client, farmer] = await Promise.all([Client.findById(order.client), Farmer.findById(order.farmer)]);
  const text = `Order ${order.orderId} is now ${next}.`;
  if (req.user.role !== 'client' && client) await notify(client.user, 'Order update', text, 'order', '/client/orders');
  if (req.user.role !== 'farmer' && farmer) await notify(farmer.user, 'Order update', text, 'order', '/farmer/orders');

  res.json({ success: true, data: await populateOrder(Order.findById(order._id)) });
});

exports.remove = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (!['Rejected', 'Cancelled', 'Delivered'].includes(order.status)) await restoreStock(order.items);
  await Promise.all([Order.deleteOne({ _id: order._id }), Payment.deleteMany({ order: order._id })]);
  res.json({ success: true, message: 'Order deleted' });
});
