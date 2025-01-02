// backend/src/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// Add middleware for admin check
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all users (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-githubAccessToken'); // Exclude sensitive data
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-githubAccessToken');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user (admin only)
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;