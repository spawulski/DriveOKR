// backend/src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: {
    type: String
  },
  googleId: {  // Google OpenID subject (`sub`); separate identity from githubId
    type: String
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

// Each provider id is unique when present. Partial (not plain unique) indexes
// let users that lack one provider's id coexist. Existing databases still have
// the old non-partial githubId_1 index; see
// src/scripts/migrateUserProviderIndexes.js.
userSchema.index({ githubId: 1 }, { unique: true, partialFilterExpression: { githubId: { $type: 'string' } } });
userSchema.index({ googleId: 1 }, { unique: true, partialFilterExpression: { googleId: { $type: 'string' } } });

// Helper method to check if user is admin
userSchema.methods.isUserAdmin = function() {
  return this.isAdmin === true;
};

module.exports = mongoose.model('User', userSchema);