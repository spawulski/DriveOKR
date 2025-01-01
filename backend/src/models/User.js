// backend/src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: { 
    type: String, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  role: {
    type: String,
    enum: ['individual', 'team_lead', 'manager', 'admin'],
    default: 'individual'
  },
  isAdmin: {  // Explicit admin flag for clearer permissions
    type: Boolean,
    default: false
  },
  githubAccessToken: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastLogin: { 
    type: Date 
  }
});

// Helper method to check if user is admin
userSchema.methods.isUserAdmin = function() {
  return this.isAdmin === true;
};

module.exports = mongoose.model('User', userSchema);