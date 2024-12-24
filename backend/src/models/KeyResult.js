// backend/src/models/KeyResult.js
const mongoose = require('mongoose');

const keyResultSchema = new mongoose.Schema({
  objective: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Objective',
    required: true
  },
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
  metricType: {
    type: String,
    enum: ['number', 'percentage', 'currency', 'boolean'],
    required: true
  },
  startValue: {
    type: Number,
    required: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  currentValue: {
    type: Number,
    required: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  confidenceLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    required: true
  },
  confidenceHistory: [{
    level: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    note: {
      type: String,
      required: false
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  progressHistory: [{
    value: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  unit: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['on_track', 'at_risk', 'behind', 'completed'],
    default: 'on_track'
  }
}, {
  timestamps: true
});

// Validate confidence level based on progress and status
keyResultSchema.pre('save', async function(next) {
 // Calculate progress
 const totalRange = this.targetValue - this.startValue;
 const currentProgress = this.currentValue - this.startValue;
 
 if (totalRange > 0) {
   this.progress = Math.round((currentProgress / totalRange) * 100);
 } else {
   this.progress = this.currentValue >= this.targetValue ? 100 : 0;
 }

 console.log('Progress calculation:', {
   title: this.title,
   currentValue: this.currentValue,
   targetValue: this.targetValue,
   startValue: this.startValue,
   calculatedProgress: this.progress
 });

 // Update status based on progress and confidence
 if (this.currentValue >= this.targetValue) {
   this.status = 'completed';
 } else if (this.progress >= 75 && this.confidenceLevel === 'high') {
   this.status = 'on_track';
 } else if (this.progress < 25 || this.confidenceLevel === 'low') {
   this.status = 'at_risk';
 } else if (this.progress < 50 && this.confidenceLevel !== 'high') {
   this.status = 'behind';
 } else {
   this.status = 'on_track';
 }

 console.log('Status update:', {
   title: this.title,
   progress: this.progress,
   confidenceLevel: this.confidenceLevel,
   status: this.status
 });

  // Track confidence changes
  if (this.isModified('confidenceLevel')) {
    this.confidenceHistory.push({
      level: this.confidenceLevel,
      timestamp: new Date()
    });
  }

  // Add to progress history if currentValue changed
  if (this.isModified('currentValue')) {
    this.progressHistory.push({
      value: this.currentValue,
      date: new Date()
    });
  }

  next();
});

// Add method to update confidence with note
keyResultSchema.methods.updateConfidence = async function(level, note) {
  if (!['low', 'medium', 'high'].includes(level)) {
    throw new Error('Invalid confidence level');
  }

  this.confidenceLevel = level;
  this.confidenceHistory.push({
    level,
    note,
    timestamp: new Date()
  });

  await this.save();
};

module.exports = mongoose.model('KeyResult', keyResultSchema);