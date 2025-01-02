// backend/src/routes/departments.js
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

module.exports = router;
// // backend/src/routes/departments.js
// const express = require('express');
// const router = express.Router();
// const Department = require('../models/Department');
// const { requireAuth } = require('../middleware/auth');

// router.get('/', requireAuth, async (req, res) => {
//   try {
//     const departments = await Department.find().populate('manager', 'name email');
//     res.json(departments);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// router.post('/', requireAuth, async (req, res) => {
//   try {
//     const department = new Department(req.body);
//     await department.save();
//     res.status(201).json(department);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

// router.patch('/:id/manager', requireAuth, async (req, res) => {
//   try {
//     const department = await Department.findByIdAndUpdate(
//       req.params.id,
//       { manager: req.body.managerId },
//       { new: true }
//     ).populate('manager', 'name email');
//     res.json(department);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

// module.exports = router;