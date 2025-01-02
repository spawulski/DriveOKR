// backend/src/models/Team.js
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  teamLead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Team', teamSchema);