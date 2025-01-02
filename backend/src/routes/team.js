// backend/src/routes/teams.js
const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const { requireAuth } = require('../middleware/auth');

const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all teams
router.get('/', requireAuth, async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('department', 'name')
      .populate('teamLead', 'name email')
      .populate('members', 'name email');
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create team
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Clean up the request body
    const teamData = {
      name: req.body.name,
      department: req.body.department
    };

    // Only add teamLead if it's not empty
    if (req.body.teamLead && req.body.teamLead !== '') {
      teamData.teamLead = req.body.teamLead;
    }

    // Only add members if they exist
    if (req.body.members && Array.isArray(req.body.members)) {
      teamData.members = req.body.members.filter(member => member && member !== '');
    }

    const team = new Team(teamData);
    await team.save();
    
    // Populate the response
    const populatedTeam = await Team.findById(team._id)
      .populate('department', 'name')
      .populate('teamLead', 'name email')
      .populate('members', 'name email');
      
    res.status(201).json(populatedTeam);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update team lead
router.patch('/:id/lead', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { leadId } = req.body;
    
    // Handle empty lead ID
    const update = leadId ? { teamLead: leadId } : { $unset: { teamLead: 1 } };
    
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate([
      { path: 'department', select: 'name' },
      { path: 'teamLead', select: 'name email' },
      { path: 'members', select: 'name email' }
    ]);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    console.error('Error updating team lead:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update team members
router.patch('/:id/members', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { members } = req.body;
    
    // Filter out empty member IDs
    const validMembers = members.filter(id => id && id !== '');
    
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { members: validMembers },
      { new: true }
    ).populate([
      { path: 'department', select: 'name' },
      { path: 'teamLead', select: 'name email' },
      { path: 'members', select: 'name email' }
    ]);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    console.error('Error updating team members:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;