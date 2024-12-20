// backend/src/routes/auth.js
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.get('/github',
  passport.authenticate('github', { 
    scope: ['user:email'] 
  })
);

router.get('/github/callback',
  passport.authenticate('github', { 
    session: false,
    failureRedirect: 'http://localhost:3000/login' 
  }),
  (req, res) => {
    console.log('GitHub callback successful, user:', req.user); // Debug log

    const token = jwt.sign(
      { id: req.user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    // Make sure we're using the correct frontend URL
    const redirectUrl = `http://localhost:3000/auth/callback?token=${token}`;
    console.log('Redirecting to:', redirectUrl); // Debug log
    
    res.redirect(redirectUrl);
  }
);

router.get('/verify', 
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    console.log('Verifying token for user:', req.user); // Debug log
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        department: req.user.department
      }
    });
  }
);

module.exports = router;