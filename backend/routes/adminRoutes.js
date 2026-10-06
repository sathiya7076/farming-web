const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { loadController, handler, v } = require('../utils/routeHelpers');

const a = loadController('adminController');
const p = loadController('productController');
const o = loadController('orderController');
const cat = loadController('categoryController');
const rev = loadController('reviewController');
const cmp = loadController('complaintController');

const ha = (n) => handler(a, n, 'adminController');

router.use(protect, authorize('admin'));

router.get('/dashboard', ha('dashboard'));
router.get('/activity', ha('activity'));
router.get('/reports', ha('reports'));

// GET /api/admin/farmers?status=pending&page=1&limit=8
router.get('/farmers', ha('farmers'));
router.put('/farmers/:id/status', v(a.userStatusSchema), ha('setFarmerStatus'));

router.get('/clients', ha('clients'));
router.put('/clients/:id/status', v(a.userStatusSchema), ha('setClientStatus'));

router.get('/products', handler(p, 'adminList', 'productController'));
router.put('/products/:id/status', v(p.statusSchema), handler(p, 'adminSetStatus', 'productController'));

router.get('/orders', handler(o, 'list', 'orderController'));
router.get('/payments', ha('payments'));

router.get('/categories', handler(cat, 'adminList', 'categoryController'));
router.post('/categories', v(cat.schema), handler(cat, 'create', 'categoryController'));
router.put('/categories/:id', v(cat.schema), handler(cat, 'update', 'categoryController'));
router.delete('/categories/:id', handler(cat, 'remove', 'categoryController'));

router.get('/reviews', handler(rev, 'adminList', 'reviewController'));
router.delete('/reviews/:id', handler(rev, 'adminRemove', 'reviewController'));

router.get('/complaints', handler(cmp, 'adminList', 'complaintController'));
router.put('/complaints/:id', v(cmp.updateSchema), handler(cmp, 'adminUpdate', 'complaintController'));

router.post('/notifications', v(a.sendNotificationSchema), ha('sendNotification'));

module.exports = router;