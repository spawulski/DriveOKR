// backend/src/routes/index.js
const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const objectiveRoutes = require('./objectives');
const keyResultRoutes = require('./keyResults');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const Department = require('../models/Department');
const Team = require('../models/Team');
const Objective = require('../models/Objective');
const departmentRoutes = require('./department');  // Add these
const teamRoutes = require('./team');             // new routes
const userRoutes = require('./users');  

// Add admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Define routes
router.use('/auth', authRoutes);
router.use('/objectives', objectiveRoutes);
router.use('/key-results', keyResultRoutes);
router.use('/admin/*', requireAuth, requireAdmin);
router.use('/departments', departmentRoutes);      // Add these
router.use('/teams', teamRoutes);                 // new route
router.use('/users', userRoutes);    

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Add admin metrics endpoint
router.get('/admin/metrics', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Fetch metrics data
    const metrics = await Promise.all([
      User.countDocuments(),
      Department.countDocuments(),
      Team.countDocuments(),
      Objective.countDocuments(),
    ]);

    res.json({
      totalUsers: metrics[0],
      totalDepartments: metrics[1],
      totalTeams: metrics[2],
      totalObjectives: metrics[3]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

module.exports = router;