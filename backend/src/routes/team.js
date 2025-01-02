// backend/src/routes/teams.js
const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
 try {
   const teams = await Team.find()
     .populate('department', 'name')
     .populate('teamLead', 'name email')
     .populate('members', 'name email');
   res.json(teams);
 } catch (error) {
   res.status(500).json({ error: error.message });
 }
});

router.post('/', requireAuth, async (req, res) => {
 try {
   const team = new Team(req.body);
   await team.save();
   res.status(201).json(team);
 } catch (error) {
   res.status(400).json({ error: error.message });
 }
});

router.patch('/:id/lead', requireAuth, async (req, res) => {
 try {
   const team = await Team.findByIdAndUpdate(
     req.params.id,
     { teamLead: req.body.leadId },
     { new: true }
   ).populate(['teamLead', 'members']);
   res.json(team);
 } catch (error) {
   res.status(400).json({ error: error.message });
 }
});

router.patch('/:id/members', requireAuth, async (req, res) => {
 try {
   const team = await Team.findByIdAndUpdate(
     req.params.id,
     { members: req.body.members },
     { new: true }
   ).populate(['teamLead', 'members']);
   res.json(team);
 } catch (error) {
   res.status(400).json({ error: error.message });
 }
});

module.exports = router;