// backend/src/routes/auth.js
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');


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

// Add some debug logging
router.post('/okta/callback', async (req, res) => {
  console.log('Received OKTA callback request:', req.body);
  
  try {
    const { oktaId, email, name } = req.body;
    
    if (!oktaId || !email) {
      console.log('Missing required fields:', { oktaId, email, name });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let user = await User.findOne({ oktaId });
    console.log('Existing user:', user);
    
    if (!user) {
      console.log('Creating new user with:', { oktaId, email, name });
      user = await User.create({
        oktaId,
        email,
        name,
        authProvider: 'okta',
        role: 'individual'
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Generated token and sending response');
    res.json({ 
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.role === 'admin'
      }
    });
  } catch (error) {
    console.error('OKTA callback error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

module.exports = router;