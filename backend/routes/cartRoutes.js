const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { loadController, handler, v, alias } = require('../utils/routeHelpers');

const c = loadController('cartController');
const h = (n) => handler(c, n, 'cartController');

router.use(protect, authorize('client'));

router.get('/', h('get'));
router.post('/', v(c.addSchema), h('add'));                           // { productId, quantity }
router.put('/:id', alias, v(c.updateSchema), h('update'));           // { quantity }
router.delete('/:id', alias, h('remove'));
router.delete('/', h('clear'));

module.exports = router;