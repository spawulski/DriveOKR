// backend/src/routes/keyResults.js
const express = require('express');
const router = express.Router();
const { KeyResult } = require('../models/KeyResult');
const { Objective } = require('../models/Objective');
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
    const objective = await Objective.findById(req.body.objective);
    
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }

    // Check permissions
    if (
      objective.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Unauthorized to add key results to this objective' });
    }

    const keyResult = new KeyResult(req.body);
    await keyResult.save();
    res.status(201).json(keyResult);
  } catch (error) {
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

    const objective = await Objective.findById(keyResult.objective);
    
    // Check permissions
    if (
      objective.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Unauthorized to update this key result' });
    }

    Object.assign(keyResult, req.body);
    await keyResult.save();
    res.json(keyResult);
  } catch (error) {
    res.status(400).json({ error: error.message });
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

// Get confidence history
router.get('/:id/confidence-history', requireAuth, async (req, res) => {
  try {
    const keyResult = await KeyResult.findById(req.params.id);
    if (!keyResult) {
      return res.status(404).json({ error: 'Key Result not found' });
    }

    const history = keyResult.getConfidenceHistory({
      from: req.query.from ? new Date(req.query.from) : undefined,
      to: req.query.to ? new Date(req.query.to) : undefined
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;