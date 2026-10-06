const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { loadController, handler, v } = require('../utils/routeHelpers');

const c = loadController('profileController');
const h = (n) => handler(c, n, 'profileController');

router.use(protect);

router.get('/', h('get'));
router.put('/', v(c.updateSchema), h('update'));
router.put('/password', v(c.passwordSchema), h('changePassword'));
router.post('/addresses', v(c.addressSchema), h('addAddress'));
router.delete('/addresses/:id', h('removeAddress'));

module.exports = router;