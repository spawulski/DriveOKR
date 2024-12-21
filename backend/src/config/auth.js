// backend/src/config/auth.js
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const User = require('../models/User');

const setupAuth = () => {
  // JWT Strategy
  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  }, async (payload, done) => {
    try {
      const user = await User.findById(payload.id);
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  }));

  // GitHub Strategy with error handling
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'http://localhost:4000/api/auth/github/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ githubId: profile.id });
      
      if (user) {
        // Update last login and save new access token if needed
        user.lastLogin = new Date();
        user.githubAccessToken = accessToken; // Add this field to your User model
        await user.save();
        return done(null, user);
      }
      
      user = await new User({
        githubId: profile.id,
        email: profile.emails?.[0]?.value || `${profile.username}@github.com`,
        name: profile.displayName || profile.username,
        role: 'individual',
        githubAccessToken: accessToken
      }).save();
      
      done(null, user);
    } catch (error) {
      console.error('GitHub auth error:', error);
      done(error, false);
    }
  }));
};

module.exports = { setupAuth };

//   // Serialize user for the session
//   passport.serializeUser((user, done) => {
//     done(null, user.id);
//   });

//   // Deserialize user from the session
//   passport.deserializeUser(async (id, done) => {
//     try {
//       const user = await User.findById(id);
//       done(null, user);
//     } catch (error) {
//       done(error, null);
//     }
//   });
// };

// module.exports = { setupAuth };