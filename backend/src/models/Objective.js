// backend/src/models/Objective.js
const mongoose = require('mongoose');

const objectiveSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['individual', 'team', 'department', 'organization'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  timeframe: {
    quarter: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    year: {
      type: Number,
      required: true
    }
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  parentObjective: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Objective',
    required: false
  },
  // Update department to reference Department model
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: function() {
      return this.type === 'department' || this.type === 'individual' || this.type === 'team';
    }
  },
  // Add team field
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: function() {
      return this.type === 'team';
    }
  }
}, {
  timestamps: true
});

// Calculate progress based on key results
objectiveSchema.methods.calculateProgress = async function() {
  const keyResults = await mongoose.model('KeyResult').find({ objective: this._id });
  if (keyResults.length === 0) return 0;
  
  const totalProgress = keyResults.reduce((sum, kr) => sum + kr.progress, 0);
  return Math.round(totalProgress / keyResults.length);
};

const Objective = mongoose.model('Objective', objectiveSchema);
module.exports = Objective;