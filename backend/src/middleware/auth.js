// backend/src/middleware/auth.js
const passport = require('passport');

const requireAuth = passport.authenticate('jwt', { session: false });

const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Unauthorized: Insufficient permissions'
    });
  }
  next();
};

module.exports = { requireAuth, requireRole };