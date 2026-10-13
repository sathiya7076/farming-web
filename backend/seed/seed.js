/* Demo data: 5 farmers, 10 clients, 20 products, 15 orders, reviews, notifications.
   Usage: npm run seed   (wipes all collections first). Passwords come from .env */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Client = require('../models/Client');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const Complaint = require('../models/Complaint');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const { slugify } = require('../utils/helpers');

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
  console.error('Refusing to seed in production (set ALLOW_SEED=true to override).');
  process.exit(1);
}
['MONGODB_URI', 'SEED_ADMIN_PASSWORD', 'SEED_FARMER_PASSWORD', 'SEED_CLIENT_PASSWORD'].forEach((k) => {
  if (!process.env[k]) {
    console.error(`Missing ${k}. Copy .env.example to .env first.`);
    process.exit(1);
  }
});

const daysAgo = (n) => new Date(Date.now() - n * 864e5);
const img = (kw, lock) => `https://loremflickr.com/800/600/${kw}?lock=${lock}`;

const CATEGORIES = [
  ['Vegetables', 'Fresh seasonal vegetables straight from the field'],
  ['Fruits', 'Orchard-fresh fruits picked at peak ripeness'],
  ['Grains', 'Wheat, millets and other whole grains'],
  ['Pulses', 'Protein-rich lentils and dals'],
  ['Rice', 'Traditional and aromatic rice varieties'],
  ['Organic Products', 'Certified-natural farm produce'],
  ['Spices', 'Whole spices from hill estates'],
  ['Seeds', 'Quality seeds for your garden or farm'],
  ['Dairy Products', 'Fresh milk and farm dairy'],
];

const FARMERS = [
  ['Murugan Selvam', 'Green Valley Farms', 'Thanjavur, Tamil Nadu', 'Third-generation paddy and pulse farmer growing without harmful pesticides.', '12 acres', 18, ['Rice', 'Pulses']],
  ['Lakshmi Devi', 'Sunrise Organics', 'Coimbatore, Tamil Nadu', 'Organic vegetable grower supplying fresh produce within 24 hours of harvest.', '6 acres', 9, ['Organic', 'Vegetables']],
  ['Ramesh Patel', 'Patel Orchards', 'Nashik, Maharashtra', 'Grape and pomegranate orchards with drip irrigation and careful grading.', '20 acres', 22, ['Fruits']],
  ['Gurpreet Singh', 'Singh Dairy & Grains', 'Ludhiana, Punjab', 'Wheat, basmati and a small desi-cow dairy run by our family.', '30 acres', 25, ['Grains', 'Dairy']],
  ['Anita Nair', 'Spice Hills Estate', 'Wayanad, Kerala', 'Shade-grown spices and bananas from the Western Ghats.', '8 acres', 14, ['Spices', 'Seeds']],
];

const CLIENTS = [
  ['Priya Sharma', 'Chennai', 'Tamil Nadu'], ['Arjun Reddy', 'Hyderabad', 'Telangana'], ['Kavya Iyer', 'Bengaluru', 'Karnataka'],
  ['Rohit Mehta', 'Mumbai', 'Maharashtra'], ['Sneha Kulkarni', 'Pune', 'Maharashtra'], ['Vikram Rao', 'Chennai', 'Tamil Nadu'],
  ['Divya Menon', 'Kochi', 'Kerala'], ['Aman Verma', 'Delhi', 'Delhi'], ['Meera Pillai', 'Coimbatore', 'Tamil Nadu'], ['Karthik Raja', 'Madurai', 'Tamil Nadu'],
];

// [name, category, farmerIdx, price, qty, unit, keyword, status, harvestDaysAgo, description, featured]
const PRODUCTS = [
  ['Fresh Tomatoes', 'Vegetables', 1, 32, 500, 'kg', 'tomato', 'Available', 2, 'Juicy vine-ripened tomatoes, perfect for curries, chutneys and salads.', true],
  ['Organic Spinach', 'Organic Products', 1, 40, 120, 'kg', 'spinach', 'Available', 1, 'Tender organic spinach leaves, washed and bunched on the day of harvest.', false],
  ['Brinjal (Eggplant)', 'Vegetables', 0, 35, 300, 'kg', 'eggplant', 'Available', 3, 'Glossy purple brinjals with firm flesh, ideal for sambar and roasting.', false],
  ['Carrots', 'Vegetables', 3, 45, 400, 'kg', 'carrot', 'Available', 4, 'Sweet, crunchy carrots from Punjab loam soil.', false],
  ['Alphonso Mangoes', 'Fruits', 2, 180, 250, 'kg', 'mango', 'Available', 3, 'Naturally ripened Alphonso mangoes with rich aroma and saffron-coloured pulp.', true],
  ['Pomegranate', 'Fruits', 2, 140, 200, 'kg', 'pomegranate', 'Available', 5, 'Deep red Bhagwa pomegranates, juicy and sweet.', false],
  ['Seedless Grapes', 'Fruits', 2, 90, 180, 'kg', 'grapes', 'Available', 2, 'Sweet green seedless grapes from Nashik vineyards.', false],
  ['Nendran Bananas', 'Fruits', 4, 60, 220, 'kg', 'banana', 'Pending', 2, 'Kerala Nendran bananas, great for chips and steaming.', false],
  ['Sharbati Wheat', 'Grains', 3, 34, 2000, 'kg', 'wheat', 'Available', 20, 'Premium Sharbati wheat, ideal for soft rotis.', false],
  ['Ragi (Finger Millet)', 'Grains', 0, 55, 800, 'kg', 'millet', 'Available', 25, 'Stone-cleaned finger millet, rich in calcium and fibre.', false],
  ['Toor Dal', 'Pulses', 0, 120, 600, 'kg', 'lentils', 'Available', 30, 'Unpolished toor dal with a natural earthy flavour.', false],
  ['Moong Dal', 'Pulses', 3, 110, 500, 'kg', 'beans', 'Rejected', 28, 'Split yellow moong dal.', false],
  ['Ponni Rice', 'Rice', 0, 62, 3000, 'kg', 'rice', 'Available', 40, 'Soft, fluffy Ponni rice, a South Indian staple.', true],
  ['Basmati Rice', 'Rice', 3, 95, 1500, 'kg', 'basmati', 'Available', 45, 'Extra-long grain aged basmati with a fragrant aroma.', false],
  ['Organic Jaggery', 'Organic Products', 1, 85, 150, 'kg', 'jaggery', 'Available', 10, 'Chemical-free sugarcane jaggery, made in small batches.', false],
  ['Black Pepper', 'Spices', 4, 650, 80, 'kg', 'pepper', 'Available', 35, 'Bold, pungent black pepper sun-dried on the estate.', true],
  ['Green Cardamom', 'Spices', 4, 1800, 40, 'kg', 'cardamom', 'Pending', 30, 'Premium 8mm green cardamom pods.', false],
  ['Hybrid Tomato Seeds', 'Seeds', 4, 250, 60, 'packet', 'seeds', 'Available', 60, 'High-yield hybrid tomato seeds, 10g pack with germination guide.', false],
  ['A2 Cow Milk', 'Dairy Products', 3, 70, 100, 'litre', 'milk', 'Available', 0, 'Fresh A2 milk from desi cows, delivered chilled.', true],
  ['Fresh Paneer', 'Dairy Products', 3, 320, 0, 'kg', 'cheese', 'Out of Stock', 1, 'Soft farm-fresh paneer made daily.', false],
];

const REVIEW_TEXT = [
  'Super fresh and exactly as described. Will order again!',
  'Good quality and well packed. Delivery was on time.',
  'Excellent taste, you can tell it is straight from the farm.',
  'Very good, slightly smaller size than I expected but fresh.',
  'Best I have bought online. Farmer was very responsive.',
  'Decent quality for the price.',
  'Loved it! Fragrant and clean.',
  'Great value, my family loved it.',
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Clearing old data…');
  await Promise.all([User, Farmer, Client, Category, Product, Order, Payment, Review, Notification, Complaint, Cart, Wishlist].map((m) => m.deleteMany({})));

  // ---- categories ----
  const cats = await Category.insertMany(CATEGORIES.map(([name, description]) => ({ name, slug: slugify(name), description })));
  const catByName = Object.fromEntries(cats.map((c) => [c.name, c]));

  // ---- admin ----
  const admin = await User.create({ name: 'AgriConnect Admin', email: 'sathi2392005@gmail.com', password: process.env.SEED_ADMIN_PASSWORD, role: 'admin', phone: '+91 8270300239' });

  // ---- farmers ----
  const farmers = [];
  for (let i = 0; i < FARMERS.length; i++) {
    const [name, farmName, location, bio, farmSize, exp, specialties] = FARMERS[i];
    const user = await User.create({ name, email: `farmer${i + 1}@agriconnect.com`, password: process.env.SEED_FARMER_PASSWORD, role: 'farmer', status: 'active', phone: `+91 98400 1000${i}` });
    await User.updateOne({ _id: user._id }, { $set: { createdAt: daysAgo(170 - i * 25) } }, { timestamps: false });
    const f = await Farmer.create({ user: user._id, farmName, location, bio, farmSize, experienceYears: exp, specialties, featured: i < 4 });
    farmers.push(f);
  }

  // ---- clients ----
  const clients = [];
  for (let i = 0; i < CLIENTS.length; i++) {
    const [name, city, state] = CLIENTS[i];
    const user = await User.create({ name, email: `client${i + 1}@agriconnect.com`, password: process.env.SEED_CLIENT_PASSWORD, role: 'client', phone: `+91 97000 2000${i}` });
    await User.updateOne({ _id: user._id }, { $set: { createdAt: daysAgo(165 - i * 14) } }, { timestamps: false });
    const c = await Client.create({
      user: user._id,
      addresses: [{ label: 'Home', fullName: name, phone: `+91 97000 2000${i}`, line1: `${12 + i}, Green Park Road`, city, state, pincode: `6000${10 + i}`, isDefault: true }],
    });
    await Cart.create({ client: c._id, items: [] });
    await Wishlist.create({ client: c._id, products: [] });
    clients.push(c);
  }

  // ---- products ----
  const products = [];
  for (let i = 0; i < PRODUCTS.length; i++) {
    const [name, cat, fi, price, quantity, unit, kw, status, harvest, description, featured] = PRODUCTS[i];
    const farmer = farmers[fi];
    const p = await Product.create({
      name, category: catByName[cat]._id, farmer: farmer._id, price, quantity, unit, status, featured, description,
      location: farmer.location, harvestDate: daysAgo(harvest),
      images: [{ url: img(kw, i + 1) }, { url: img(kw, i + 101) }],
      rejectionReason: status === 'Rejected' ? 'Product photos are unclear. Please upload better images.' : undefined,
    });
    await Product.updateOne({ _id: p._id }, { $set: { createdAt: daysAgo(100 - i * 4) } }, { timestamps: false });
    products.push(p);
  }
  const listed = products.filter((p) => ['Available', 'Out of Stock'].includes(p.status) && p.quantity > 0);

  // ---- orders ----
  const STATUSES = ['Delivered', 'Delivered', 'Delivered', 'Delivered', 'Delivered', 'Delivered', 'Delivered', 'Delivered', 'Shipped', 'Processing', 'Accepted', 'Pending', 'Pending', 'Cancelled', 'Rejected'];
  const AGES = [160, 140, 125, 110, 95, 80, 65, 50, 30, 18, 12, 5, 3, 20, 25];
  const orders = [];
  for (let i = 0; i < 15; i++) {
    const client = clients[i % clients.length];
    const first = listed[(i * 7) % listed.length];
    const sameFarmer = listed.filter((p) => String(p.farmer) === String(first.farmer) && String(p._id) !== String(first._id));
    const picks = [first, ...(i % 3 === 0 && sameFarmer.length ? [sameFarmer[0]] : [])];
    const items = picks.map((p) => ({ product: p._id, name: p.name, image: p.images[0].url, unit: p.unit, price: p.price, quantity: 2 + (i % 4) * 3 }));
    const total = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const status = STATUSES[i];
    const online = i % 2 === 1;
    const orderDate = daysAgo(AGES[i]);
    const addr = (await Client.findById(client._id)).addresses[0];
    const paymentStatus = status === 'Delivered' ? 'Paid' : ['Cancelled', 'Rejected'].includes(status) ? (online ? 'Refunded' : 'Failed') : online ? 'Paid' : 'Pending';

    const order = await Order.create({
      client: client._id, farmer: first.farmer, items, totalAmount: total,
      deliveryAddress: { fullName: addr.fullName, phone: addr.phone, line1: addr.line1, city: addr.city, state: addr.state, pincode: addr.pincode },
      paymentMethod: online ? 'MockOnline' : 'COD', paymentStatus, status, orderDate,
      deliveryDate: status === 'Delivered' ? new Date(orderDate.getTime() + 4 * 864e5) : undefined,
      statusHistory: [{ status: 'Pending', at: orderDate }, ...(status !== 'Pending' ? [{ status, at: new Date(orderDate.getTime() + 864e5) }] : [])],
    });
    await Order.updateOne({ _id: order._id }, { $set: { createdAt: orderDate } }, { timestamps: false });
    await Payment.create({
      order: order._id, client: client._id, farmer: first.farmer, amount: total, method: online ? 'MockOnline' : 'COD',
      status: paymentStatus, transactionId: online ? `MOCK-SEED-${i + 1}` : undefined, paidAt: paymentStatus === 'Paid' ? orderDate : undefined,
    });
    orders.push(order);
  }

  // ---- reviews (first 8 delivered orders) ----
  const RATINGS = [5, 4, 5, 4, 5, 3, 5, 4];
  for (let i = 0; i < 8; i++) {
    const o = orders[i];
    const item = o.items[0];
    await Review.create({ product: item.product, farmer: o.farmer, client: o.client, order: o._id, rating: RATINGS[i], comment: REVIEW_TEXT[i] });
    await Order.updateOne({ _id: o._id }, { $push: { reviewedProducts: item.product } });
  }
  for (const p of products) {
    const rs = await Review.find({ product: p._id });
    if (rs.length) await Product.updateOne({ _id: p._id }, { ratingAvg: Math.round((rs.reduce((s, r) => s + r.rating, 0) / rs.length) * 10) / 10, ratingCount: rs.length });
  }
  for (const f of farmers) {
    const rs = await Review.find({ farmer: f._id });
    if (rs.length) await Farmer.updateOne({ _id: f._id }, { ratingAvg: Math.round((rs.reduce((s, r) => s + r.rating, 0) / rs.length) * 10) / 10, ratingCount: rs.length });
  }

  // ---- wishlists ----
  for (let i = 0; i < 4; i++) {
    await Wishlist.updateOne({ client: clients[i]._id }, { products: [listed[i]._id, listed[i + 4]._id, listed[i + 8]._id] });
  }

  // ---- notifications ----
  const farmerUser = (fid) => farmers.find((f) => String(f._id) === String(fid)).user;
  const clientUser = async (cid) => (await Client.findById(cid)).user;
  const notes = [
    { user: admin._id, title: 'New product awaiting approval', message: 'Nendran Bananas is waiting for review.', type: 'product', link: '/admin/products' },
    { user: admin._id, title: 'New product awaiting approval', message: 'Green Cardamom is waiting for review.', type: 'product', link: '/admin/products' },
    { user: admin._id, title: 'Welcome, Admin', message: 'Your demo marketplace is ready. Explore the dashboard.', type: 'system' },
  ];
  for (const o of orders.slice(8)) {
    notes.push({ user: farmerUser(o.farmer), title: 'New order received', message: `Order ${o.orderId} is ${o.status}.`, type: 'order', link: '/farmer/orders' });
    notes.push({ user: await clientUser(o.client), title: 'Order update', message: `Order ${o.orderId} is now ${o.status}.`, type: 'order', link: '/client/orders' });
  }
  for (let i = 0; i < 5; i++) notes.push({ user: farmerUser(orders[i].farmer), title: 'New review', message: `You received a ${RATINGS[i]}-star review.`, type: 'review', link: '/farmer/reviews' });
  await Notification.insertMany(notes.map((n, i) => ({ ...n, isRead: i % 4 === 0 })));

  // ---- complaints ----
  await Complaint.insertMany([
    { user: (await clientUser(clients[0]._id)), name: CLIENTS[0][0], email: 'client1@agriconnect.com', subject: 'Packaging was damaged', message: 'The box arrived crushed. Please look into the packaging standards.', status: 'Open' },
    { user: (await clientUser(clients[3]._id)), name: CLIENTS[3][0], email: 'client4@agriconnect.com', subject: 'Refund not received', message: 'My cancelled order refund is still pending after a week.', status: 'In Review' },
    { name: 'Guest Visitor', email: 'guest@example.com', subject: 'Become a partner farmer', message: 'I run a 5 acre farm and would like to know how to join.', status: 'Resolved', adminResponse: 'Please register as a farmer and we will review your account.' },
  ]);

  console.log('\nSeed complete ✔');
  console.log('Demo logins:');
  console.log('  Admin  : sathi2392005@gmail.com   /', process.env.SEED_ADMIN_PASSWORD);
  console.log('  Farmer : farmer1@agriconnect.com /', process.env.SEED_FARMER_PASSWORD, '(farmer1..farmer5)');
  console.log('  Client : client1@agriconnect.com /', process.env.SEED_CLIENT_PASSWORD, '(client1..client10)');
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('Seed failed:', e);
  await mongoose.disconnect();
  process.exit(1);
});
