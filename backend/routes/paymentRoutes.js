const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { loadController, handler } = require('../utils/routeHelpers');

const c = loadController('paymentController');
const h = (n) => handler(c, n, 'paymentController');

router.use(protect);

router.post('/mock', authorize('client'), h('createMockPayment'));
router.get('/my', authorize('client'), h('myPayments'));
router.get('/farmer', authorize('farmer'), h('farmerPayments'));
router.get('/', authorize('admin'), h('listPayments'));

module.exports = router;