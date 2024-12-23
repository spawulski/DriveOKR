// backend/src/routes/objectives.js
const express = require('express');
const router = express.Router();
const Objective = require('../models/Objective');
const KeyResult = require('../models/KeyResult');
const { requireAuth } = require('../middleware/auth');

// Add this route at the top of your routes
router.get('/:id', requireAuth, async (req, res) => {
  try {
    console.log('Fetching objective with ID:', req.params.id);
    
    const objective = await Objective.findById(req.params.id);
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }

    // Fetch key results for this objective
    const keyResults = await KeyResult.find({ objective: objective._id });
    console.log('Found key results:', keyResults);

    res.json({
      objective: {
        _id: objective._id,
        title: objective.title,
        description: objective.description,
        type: objective.type,
        department: objective.department,
        timeframe: objective.timeframe,
        progress: objective.progress,
        status: objective.status
      },
      keyResults: keyResults.map(kr => ({
        _id: kr._id,
        title: kr.title,
        description: kr.description,
        metricType: kr.metricType,
        startValue: kr.startValue,
        targetValue: kr.targetValue,
        currentValue: kr.currentValue,
        unit: kr.unit,
        confidenceLevel: kr.confidenceLevel,
        progress: kr.progress,
        status: kr.status
      }))
    });
  } catch (error) {
    console.error('Error fetching objective:', error);
    res.status(500).json({ error: error.message });
  }
});

// backend/src/routes/objectives.js
router.get('/', requireAuth, async (req, res) => {
  try {
    const query = {};
    
    if (req.query.quarter && req.query.year) {
      query['timeframe.quarter'] = parseInt(req.query.quarter);
      query['timeframe.year'] = parseInt(req.query.year);
    }

    const objectives = await Objective.find(query)
      .populate('owner', 'name email');

    // Fetch and process key results for each objective
    const objectivesWithKRs = await Promise.all(
      objectives.map(async (objective) => {
        const keyResults = await KeyResult.find({ objective: objective._id });
        
        // Calculate overall objective progress based on KR progress
        const totalProgress = keyResults.length > 0
          ? Math.round(keyResults.reduce((sum, kr) => sum + kr.progress, 0) / keyResults.length)
          : 0;

        return {
          ...objective.toObject(),
          progress: totalProgress,
          keyResults: keyResults.map(kr => kr.toObject()) // This will include the calculated progress
        };
      })
    );

    res.json(objectivesWithKRs);
  } catch (error) {
    console.error('Error fetching objectives:', error);
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

// Update objective
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const objective = await Objective.findById(req.params.id);
    
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }

    // Check if user has permission to edit
    if (objective.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this objective' });
    }

    // Update the objective
    const updatedObjective = await Objective.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.json(updatedObjective);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// backend/src/routes/objectives.js
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const objective = await Objective.findById(req.params.id);
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }
 
    // Check if user owns this objective
    if (objective.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this objective' });
    }
 
    // Delete associated key results
    await KeyResult.deleteMany({ objective: objective._id });
    
    // Delete objective
    await Objective.findByIdAndDelete(objective._id);
    
    res.json({ message: 'Objective and key results deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
 });

module.exports = router;
