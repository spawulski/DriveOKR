// backend/src/routes/department.js
const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { requireAuth } = require('../middleware/auth');

const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all departments
router.get('/', requireAuth, async (req, res) => {
  try {
    const departments = await Department.find().populate('manager', 'name email');
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create department (admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const department = new Department(req.body);
    await department.save();
    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update department manager
router.patch('/:id/manager', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { managerId } = req.body;
    
    // Handle empty manager ID
    const update = managerId ? { manager: managerId } : { $unset: { manager: 1 } };
    
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate('manager', 'name email');

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(department);
  } catch (error) {
    console.error('Error updating department manager:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;