// backend/src/routes/keyResults.js
const express = require('express');
const router = express.Router();
const KeyResult = require('../models/KeyResult');
const Objective = require('../models/Objective');
const { requireAuth } = require('../middleware/auth');

// Get key results for an objective
router.get('/objective/:objectiveId', requireAuth, async (req, res) => {
  try {
    const keyResults = await KeyResult.find({ objective: req.params.objectiveId });
    res.json(keyResults);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create key result
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('Creating key result for objective:', req.body.objective);
    
    // First verify the objective exists
    const objective = await Objective.findById(req.body.objective);
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }

    // Create the key result
    const keyResult = new KeyResult({
      ...req.body,
      currentValue: req.body.startValue // Initialize current value to start value
    });

    await keyResult.save();
    console.log('Key result created:', keyResult);
    
    res.status(201).json(keyResult);
  } catch (error) {
    console.error('Error creating key result:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update key result
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const keyResult = await KeyResult.findById(req.params.id);
    if (!keyResult) {
      return res.status(404).json({ error: 'Key Result not found' });
    }

    // Check if user has permission through objective ownership
    const objective = await Objective.findById(keyResult.objective);
    if (!objective) {
      return res.status(404).json({ error: 'Parent objective not found' });
    }

    if (objective.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this key result' });
    }

    // Update the key result fields
    Object.assign(keyResult, {
      ...req.body,
      updatedAt: new Date()
    });

    // Save the key result (this will trigger the pre-save hooks)
    await keyResult.save();

    // Fetch the fresh document to ensure we have all calculated fields
    const updatedKeyResult = await KeyResult.findById(req.params.id);
    
    console.log('Updated Key Result:', {
      title: updatedKeyResult.title,
      progress: updatedKeyResult.progress,
      status: updatedKeyResult.status,
      currentValue: updatedKeyResult.currentValue,
      targetValue: updatedKeyResult.targetValue
    });

    res.json(updatedKeyResult);
  } catch (error) {
    console.error('Error updating key result:', error);
    res.status(400).json({ error: error.message });
  }
});

// backend/src/routes/keyResults.js
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const keyResult = await KeyResult.findById(req.params.id);
    if (!keyResult) {
      return res.status(404).json({ error: 'Key Result not found' });
    }

    // Delete the key result
    await KeyResult.findByIdAndDelete(keyResult._id);
    
    res.json({ message: 'Key Result deleted successfully' });
  } catch (error) {
    console.error('Delete key result error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update confidence level
router.patch('/:id/confidence', requireAuth, async (req, res) => {
  try {
    const keyResult = await KeyResult.findById(req.params.id);
    if (!keyResult) {
      return res.status(404).json({ error: 'Key Result not found' });
    }

    const objective = await Objective.findById(keyResult.objective);
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }
    
    // Check permissions
    if (
      objective.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Unauthorized to update this key result' });
    }

    await keyResult.updateConfidence(req.body.confidenceLevel, req.body.note);
    res.json(keyResult);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;