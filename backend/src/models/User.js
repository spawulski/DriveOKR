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
  role: {
    type: String,
    enum: ['individual', 'manager', 'admin'],
    default: 'individual'
  },
  department: { 
    type: String 
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

module.exports = mongoose.model('User', userSchema);