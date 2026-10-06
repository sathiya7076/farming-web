const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { loadController, handler, v } = require('../utils/routeHelpers');

const c = loadController('orderController');
const h = (n) => handler(c, n, 'orderController');

router.use(protect);

// the controller filters by req.user.role (client / farmer / admin)
router.get('/', h('list'));
router.get('/summary', h('summary'));
router.get('/:id', h('getOne'));
router.post('/', authorize('client'), v(c.createSchema), h('create'));
router.put('/:id/status', authorize('farmer', 'client', 'admin'), v(c.statusSchema), h('updateStatus'));

module.exports = router;