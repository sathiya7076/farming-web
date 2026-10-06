const router = require('express').Router();
const { loadController, handler } = require('../utils/routeHelpers');

const c = loadController('publicController');
const h = (n) => handler(c, n, 'publicController');

router.get('/home', h(['home', 'getHome', 'homeData', 'stats', 'getStats']));
router.post('/contact', h(['contact', 'sendContact', 'submitContact', 'createContact']));

module.exports = router;