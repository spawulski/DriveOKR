// backend/src/routes/auth.js
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { loadAuthConfig } = require('../config/oauth');
const { getGoogleAuth } = require('../config/auth');
const router = express.Router();

// Redirect targets are fixed paths on the configured frontend origin only.
const failTo = (res, code) =>
  res.redirect(`${loadAuthConfig().frontendUrl}/?auth_error=${encodeURIComponent(code)}`);

const signInRedirect = (res, user) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.redirect(`${loadAuthConfig().frontendUrl}/auth/callback?token=${token}`);
};

// GitHub OAuth routes
router.get('/github',
  passport.authenticate('github', {
    scope: ['user:email'],
    session: false
  })
);

router.get('/github/callback',
  (req, res, next) => {
    passport.authenticate('github', {
      session: false
    }, (err, user, info) => {
      if (err) {
        console.error('GitHub callback error:', err);
        return failTo(res, 'github_failed');
      }

      if (!user) {
        console.error('No user from GitHub:', info);
        return failTo(res, 'github_failed');
      }

      signInRedirect(res, user);
    })(req, res, next);
  }
);

// Google OAuth routes (optional provider)
const requireGoogle = (req, res, next) =>
  getGoogleAuth().enabled ? next() : failTo(res, 'google_unavailable');

router.get('/google',
  requireGoogle,
  passport.authenticate('google', { session: false })
);

router.get('/google/callback',
  requireGoogle,
  (req, res, next) => {
    // Provider-reported errors (including the user pressing Cancel) end the
    // flow here; the pending state is consumed so it cannot be reused.
    if (req.query.error) {
      const valid = getGoogleAuth().stateStore.consume(req, req.query.state);
      return failTo(res, valid && req.query.error === 'access_denied' ? 'google_cancelled' : 'google_failed');
    }
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        // Never log provider responses: they can echo codes or tokens.
        console.error('Google callback error:', err.name);
        return failTo(res, 'google_failed');
      }
      if (!user) {
        const code = { state_invalid: 'google_state_invalid', email_unverified: 'google_email_unverified', account_unavailable: 'google_account_unavailable' }[info?.code];
        return failTo(res, code || 'google_failed');
      }
      signInRedirect(res, user);
    })(req, res, next);
  }
);

// Verify token route with better error handling
router.get('/verify', 
  (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (err) {
        console.error('Token verification error:', err);
        return res.status(401).json({ error: 'Authentication failed' });
      }
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.user = user;
      next();
    })(req, res, next);
  },
  (req, res) => {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        department: req.user.department,
        isAdmin: req.user.isAdmin  // Add this line
      }
    });
  }
);

module.exports = router;