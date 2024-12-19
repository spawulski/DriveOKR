// backend/src/routes/objectives.js
const express = require('express');
const router = express.Router();
const Objective = require('../models/Objective');
const { requireAuth } = require('../middleware/auth');

// Get all objectives (with filters)
router.get('/', requireAuth, async (req, res) => {
  try {
    const query = {};
    
    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    // Filter by timeframe
    if (req.query.quarter && req.query.year) {
      query['timeframe.quarter'] = parseInt(req.query.quarter);
      query['timeframe.year'] = parseInt(req.query.year);
    }
    
    // Filter by department
    if (req.query.department) {
      query.department = req.query.department;
    }

    const objectives = await Objective.find(query)
      .populate('owner', 'name email')
      .populate('parentObjective', 'title');

    res.json(objectives);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new objective
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('Creating new objective:', req.body);
    const objective = new Objective({
      ...req.body,
      owner: req.user._id
    });

    await objective.save();
    res.status(201).json(objective);
  } catch (error) {
    console.error('Error creating objective:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get single objective with key results
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const objective = await Objective.findById(req.query.id)
      .populate('owner', 'name email')
      .populate('parentObjective', 'title');
    
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }

    res.json(objective);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update objective
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const objective = await Objective.findById(req.params.id);
    
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }

    // Check update permissions
    if (
      objective.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Unauthorized to update this objective' });
    }

    Object.assign(objective, req.body);
    await objective.save();
    res.json(objective);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete objective
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const objective = await Objective.findById(req.params.id);
    
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }

    // Check delete permissions
    if (
      objective.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Unauthorized to delete this objective' });
    }

    await objective.remove();
    res.json({ message: 'Objective deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
