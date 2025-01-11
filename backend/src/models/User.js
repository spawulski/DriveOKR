// backend/src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Base user information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['individual', 'team_lead', 'manager', 'admin'],
    default: 'individual'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },

  // Authentication-related fields
  authProvider: {
    type: String,
    enum: ['github', 'okta'],
    required: true
  },
  
  // GitHub-specific fields
  githubId: {
    type: String,
    sparse: true,
    unique: true
  },
  githubAccessToken: {
    type: String
  },

  // OKTA-specific fields
  oktaId: {
    type: String,
    sparse: true,
    unique: true
  },
  
  // Common fields for all auth types
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.githubAccessToken;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ authProvider: 1 });
userSchema.index({ department: 1 });
userSchema.index({ team: 1 });

// Middleware to update the updatedAt field
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find or create a user from OKTA
userSchema.statics.findOrCreateOktaUser = async function(oktaData) {
  try {
    let user = await this.findOne({ oktaId: oktaData.oktaId });
    
    if (!user) {
      user = await this.findOne({ email: oktaData.email });
      
      if (user) {
        // If user exists with same email but different auth provider, update their OKTA details
        user.oktaId = oktaData.oktaId;
        user.authProvider = 'okta';
        await user.save();
      } else {
        // Create new user
        user = await this.create({
          name: oktaData.name,
          email: oktaData.email,
          oktaId: oktaData.oktaId,
          authProvider: 'okta',
          role: 'individual'
        });
      }
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    return user;
  } catch (error) {
    console.error('Error in findOrCreateOktaUser:', error);
    throw error;
  }
};

// Static method to find or create a user from GitHub
userSchema.statics.findOrCreateGithubUser = async function(githubData) {
  try {
    let user = await this.findOne({ githubId: githubData.githubId });
    
    if (!user) {
      user = await this.findOne({ email: githubData.email });
      
      if (user) {
        // If user exists with same email but different auth provider, update their GitHub details
        user.githubId = githubData.githubId;
        user.githubAccessToken = githubData.accessToken;
        user.authProvider = 'github';
        await user.save();
      } else {
        // Create new user
        user = await this.create({
          name: githubData.name,
          email: githubData.email,
          githubId: githubData.githubId,
          githubAccessToken: githubData.accessToken,
          authProvider: 'github',
          role: 'individual'
        });
      }
    }
    
    user.lastLogin = new Date();
    user.githubAccessToken = githubData.accessToken;
    await user.save();
    
    return user;
  } catch (error) {
    console.error('Error in findOrCreateGithubUser:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;