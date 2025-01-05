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

// Calculate progress based on start and target values
keyResultSchema.methods.calculateProgress = function() {
  const { startValue, targetValue, currentValue } = this;
  const isDecreasing = targetValue < startValue;
  let progress;

  if (isDecreasing) {
    // For decreasing metrics (lower is better)
    const totalRange = startValue - targetValue;
    const currentProgress = startValue - currentValue;
    progress = totalRange !== 0 ? (currentProgress / totalRange) * 100 : 0;
  } else {
    // For increasing metrics (higher is better)
    const totalRange = targetValue - startValue;
    const currentProgress = currentValue - startValue;
    progress = totalRange !== 0 ? (currentProgress / totalRange) * 100 : 0;
  }

  // Ensure progress stays within 0-100 range
  return Math.min(Math.max(Math.round(progress), 0), 100);
};

// Check if target is met based on direction
keyResultSchema.methods.isTargetMet = function() {
  const { currentValue, targetValue, startValue } = this;
  const isDecreasing = targetValue < startValue;
  return isDecreasing ? currentValue <= targetValue : currentValue >= targetValue;
};

// Middleware to update progress and status before saving
keyResultSchema.pre('save', async function(next) {
  // Calculate progress
  this.progress = this.calculateProgress();

  // Determine if target is met
  const isTargetMet = this.isTargetMet();
  const isDecreasing = this.targetValue < this.startValue;

  console.log('Progress calculation:', {
    title: this.title,
    direction: isDecreasing ? 'decreasing' : 'increasing',
    currentValue: this.currentValue,
    targetValue: this.targetValue,
    startValue: this.startValue,
    calculatedProgress: this.progress,
    targetMet: isTargetMet
  });

  // Update status based on progress and confidence
  if (isTargetMet) {
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

// Method to update confidence with note
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