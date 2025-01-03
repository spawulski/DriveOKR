// backend/src/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Team = require('../models/Team');
const { requireAuth } = require('../middleware/auth');

// Add middleware for admin check
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Delete user
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Remove user from any teams they're in
    await Team.updateMany(
      { members: user._id },
      { $pull: { members: user._id } }
    );
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user (including admin status)
// In your user routes (backend/src/routes/users.js), make sure the patch route is handling team updates:

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log('Updating user:', req.params.id, 'with data:', req.body); // Add logging

    const updates = {};
    if (typeof req.body.isAdmin === 'boolean') {
      updates.isAdmin = req.body.isAdmin;
    }
    if ('team' in req.body) {  // Changed this condition
      updates.team = req.body.team || null;  // Allow null to remove team
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('team');  // Add populate to get team details

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Also update the team's members array
    if ('team' in req.body) {
      // Remove user from any teams they're currently in
      await Team.updateMany(
        { members: user._id },
        { $pull: { members: user._id } }
      );

      // Add user to new team if one was specified
      if (req.body.team) {
        await Team.findByIdAndUpdate(
          req.body.team,
          { $addToSet: { members: user._id } }
        );
      }
    }

    console.log('Updated user:', user); // Add logging
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).json({ error: error.message });
  }
});
// router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
//   try {
//     const updates = {};
//     if (typeof req.body.isAdmin === 'boolean') {
//       updates.isAdmin = req.body.isAdmin;
//     }
//     if (req.body.team) {
//       updates.team = req.body.team;
//     }

//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       updates,
//       { new: true }
//     ).populate('team');

//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.json(user);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

// backend/src/routes/users.js
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('-githubAccessToken')
      .populate({
        path: 'department',
        select: '_id name'
      })
      .populate({
        path: 'team',
        select: '_id name'
      });
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