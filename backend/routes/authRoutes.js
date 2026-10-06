const router = require('express').Router();
const c = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

router.post('/register', validate(c.registerSchema), c.register);
router.post('/login', validate(c.loginSchema), c.login);
router.post('/logout', c.logout);
router.get('/me', protect, c.me);
router.post('/forgot-password', validate(c.forgotSchema), c.forgotPassword);
router.post('/reset-password/:token', validate(c.resetSchema), c.resetPassword);

module.exports = router;
