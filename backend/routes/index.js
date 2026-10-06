const router = require('express').Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const product = require('../controllers/productController');
const category = require('../controllers/categoryController');
const farmer = require('../controllers/farmerController');
const cart = require('../controllers/cartController');
const wishlist = require('../controllers/wishlistController');
const order = require('../controllers/orderController');
const review = require('../controllers/reviewController');
const notification = require('../controllers/notificationController');
const complaint = require('../controllers/complaintController');
const profile = require('../controllers/profileController');
const pub = require('../controllers/publicController');
const admin = require('../controllers/adminController');

const farmerOnly = [protect, authorize('farmer')];
const clientOnly = [protect, authorize('client')];
const adminOnly = [protect, authorize('admin')];

// ----- public -----
router.get('/public/home', pub.home);
router.post('/public/contact', validate(pub.contactSchema), pub.contact);
router.get('/categories', category.listPublic);
router.get('/products', product.list);
router.get('/products/meta/locations', product.locations);
router.get('/products/mine', ...farmerOnly, product.mine);
router.get('/products/:id', optionalAuth, product.getOne);
router.get('/products/:id/reviews', review.byProduct);
router.get('/farmers', farmer.list);

// ----- farmer -----
router.get('/farmers/me/dashboard', ...farmerOnly, farmer.dashboard);
router.get('/farmers/me/earnings', ...farmerOnly, farmer.earnings);
router.get('/farmers/:id', farmer.getOne);
router.put('/farmers/:id', protect, authorize('farmer', 'admin'), validate(farmer.updateSchema), farmer.update);

router.post('/products', ...farmerOnly, upload.array('images', 5), validate(product.createSchema), product.create);
router.put('/products/:id', protect, authorize('farmer', 'admin'), upload.array('images', 5), validate(product.updateSchema), product.update);
router.delete('/products/:id', protect, authorize('farmer', 'admin'), product.remove);
router.get('/reviews/farmer', ...farmerOnly, review.forFarmer);

// ----- client -----
router.get('/cart', ...clientOnly, cart.get);
router.post('/cart', ...clientOnly, validate(cart.addSchema), cart.add);
router.delete('/cart', ...clientOnly, cart.clear);
router.put('/cart/:productId', ...clientOnly, validate(cart.updateSchema), cart.update);
router.delete('/cart/:productId', ...clientOnly, cart.remove);
router.get('/wishlist', ...clientOnly, wishlist.get);
router.post('/wishlist/:productId', ...clientOnly, wishlist.toggle);
router.post('/reviews', ...clientOnly, validate(review.createSchema), review.create);
router.get('/reviews/mine', ...clientOnly, review.mine);

// ----- orders (role scoped inside the controller) -----
router.post('/orders', ...clientOnly, validate(order.createSchema), order.create);
router.get('/orders', protect, order.list);
router.get('/orders/summary', protect, order.summary);
router.get('/orders/:id', protect, order.getOne);
router.put('/orders/:id/status', protect, validate(order.statusSchema), order.updateStatus);
router.delete('/orders/:id', ...adminOnly, order.remove);

// ----- any logged-in user -----
router.get('/notifications', protect, notification.list);
router.get('/notifications/unread-count', protect, notification.unreadCount);
router.put('/notifications/read-all', protect, notification.markAllRead);
router.put('/notifications/:id/read', protect, notification.markRead);
router.delete('/notifications/:id', protect, notification.remove);

router.get('/profile', protect, profile.get);
router.put('/profile', protect, validate(profile.updateSchema), profile.update);
router.put('/profile/password', protect, validate(profile.passwordSchema), profile.changePassword);
router.post('/profile/addresses', ...clientOnly, validate(profile.addressSchema), profile.addAddress);
router.delete('/profile/addresses/:addressId', ...clientOnly, profile.removeAddress);

router.post('/complaints', protect, authorize('farmer', 'client'), validate(complaint.createSchema), complaint.create);
router.get('/complaints/mine', protect, authorize('farmer', 'client'), complaint.mine);

// ----- admin -----
const a = require('express').Router();
a.use(protect, authorize('admin'));
a.get('/dashboard', admin.dashboard);
a.get('/activity', admin.activity);
a.get('/reports', admin.reports);
a.get('/farmers', admin.farmers);
a.put('/farmers/:id/status', validate(admin.userStatusSchema), admin.setFarmerStatus);
a.get('/clients', admin.clients);
a.put('/clients/:id/status', validate(admin.userStatusSchema), admin.setClientStatus);
a.get('/products', product.adminList);
a.put('/products/:id/status', validate(product.statusSchema), product.adminSetStatus);
a.get('/categories', category.adminList);
a.post('/categories', validate(category.schema), category.create);
a.put('/categories/:id', validate(category.schema.partial()), category.update);
a.delete('/categories/:id', category.remove);
a.get('/orders', order.list);
a.get('/payments', admin.payments);
a.get('/reviews', review.adminList);
a.delete('/reviews/:id', review.adminRemove);
a.get('/complaints', complaint.adminList);
a.put('/complaints/:id', validate(complaint.updateSchema), complaint.adminUpdate);
a.post('/notifications', validate(admin.sendNotificationSchema), admin.sendNotification);
router.use('/admin', a);

module.exports = router;
