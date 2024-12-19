// backend/src/routes/index.js
const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const objectiveRoutes = require('./objectives');
const keyResultRoutes = require('./keyResults');

router.use('/auth', authRoutes);
router.use('/objectives', objectiveRoutes);
router.use('/key-results', keyResultRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

module.exports = router;