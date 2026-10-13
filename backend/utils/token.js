const jwt = require('jsonwebtoken');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

// Cross-site deployment (Vercel frontend + separate API domain) needs SameSite=None + Secure.
const cookieOptions = () => {
  // On Vercel always use SameSite=None + Secure, even if NODE_ENV was set to "development" by mistake
  const prod = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  return {
    httpOnly: true,
    sameSite: prod ? 'none' : 'lax',
    secure: prod,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

module.exports = { signToken, verifyToken, cookieOptions };