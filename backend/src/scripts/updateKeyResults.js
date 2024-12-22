// backend/src/scripts/updateKeyResults.js
const mongoose = require('mongoose');
const KeyResult = require('../models/KeyResult');

// Use the same MongoDB URI as defined in docker-compose.yml
const MONGODB_URI = 'mongodb://localhost:27017/okr_platform';

const updateKeyResults = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all key results
    const keyResults = await KeyResult.find({});
    console.log(`Found ${keyResults.length} key results to update`);

    // Update each key result
    for (const kr of keyResults) {
      // Calculate progress
      const totalRange = kr.targetValue - kr.startValue;
      const currentProgress = kr.currentValue - kr.startValue;
      
      if (totalRange > 0) {
        kr.progress = Math.round((currentProgress / totalRange) * 100);
      } else {
        kr.progress = kr.currentValue >= kr.targetValue ? 100 : 0;
      }

      // Update status based on progress and confidence
      if (kr.currentValue >= kr.targetValue) {
        kr.status = 'completed';
      } else if (kr.progress >= 75 && kr.confidenceLevel === 'high') {
        kr.status = 'on_track';
      } else if (kr.progress < 25 || kr.confidenceLevel === 'low') {
        kr.status = 'at_risk';
      } else if (kr.progress < 50 && kr.confidenceLevel !== 'high') {
        kr.status = 'behind';
      } else {
        kr.status = 'on_track';
      }

      // Save the updated key result
      await kr.save();
      
      console.log('Updated key result:', {
        title: kr.title,
        progress: kr.progress,
        confidenceLevel: kr.confidenceLevel,
        status: kr.status,
        currentValue: kr.currentValue,
        targetValue: kr.targetValue,
        startValue: kr.startValue
      });
    }

    console.log('Successfully updated all key results');
  } catch (error) {
    console.error('Error updating key results:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

updateKeyResults();