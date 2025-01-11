// backend/src/routes/auth.js
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

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
      session: false,
      failureRedirect: 'http://localhost:3000/login'
    }, (err, user, info) => {
      if (err) {
        console.error('GitHub callback error:', err);
        return res.redirect('http://localhost:3000/login?error=auth_failed');
      }
      
      if (!user) {
        console.error('No user from GitHub:', info);
        return res.redirect('http://localhost:3000/login?error=no_user');
      }

      const token = jwt.sign(
        { id: user._id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '7d' }
      );
      
      res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
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

router.post('/okta/callback', async (req, res) => {
  try {
    const userData = {
      oktaId: req.body.oktaId,
      email: req.body.email,
      name: req.body.name
    };
    
    const user = await User.findOrCreateOktaUser(userData);
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (error) {
    console.error('OKTA callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;