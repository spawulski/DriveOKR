// backend/src/config/auth.js
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const User = require('../models/User');
const { loadAuthConfig } = require('./oauth');
const { createOAuthStateStore } = require('./oauthState');

const GOOGLE_SCOPES = ['openid', 'profile', 'email'];

// Set by setupAuth; read by the Google routes.
let google = { enabled: false, stateStore: null };
const getGoogleAuth = () => google;

// Google accounts are identified only by the OpenID subject. Email is
// informational: it never links to or grants access to an existing account,
// and profile fields never set role or admin status.
const findOrCreateGoogleUser = async (profile) => {
  const json = profile._json || {};
  const subject = profile.id;
  if (typeof subject !== 'string' || !/^[A-Za-z0-9_-]{1,255}$/.test(subject)) {
    return { user: false, info: { message: 'Invalid Google subject', code: 'failed' } };
  }
  const email = typeof json.email === 'string' ? json.email.trim().toLowerCase() : '';
  if (!email || json.email_verified !== true) {
    return { user: false, info: { message: 'Google email missing or unverified', code: 'email_unverified' } };
  }

  const existing = await User.findOneAndUpdate({ googleId: subject }, { $set: { lastLogin: new Date() } }, { new: true });
  if (existing) return { user: existing };

  try {
    const user = await new User({
      googleId: subject,
      email,
      name: profile.displayName || json.name || email,
      lastLogin: new Date(),
    }).save();
    return { user };
  } catch (error) {
    // A concurrent first sign-in for the same subject won the race.
    if (error.code === 11000 && error.keyPattern?.googleId) {
      return { user: await User.findOne({ googleId: subject }) };
    }
    if (error.code === 11000 && error.keyPattern?.githubId) {
      console.error('Google sign-in blocked by the legacy githubId_1 index; run backend/src/scripts/migrateUserProviderIndexes.js (see README)');
      return { user: false, info: { message: 'Account storage needs migration', code: 'account_unavailable' } };
    }
    throw error;
  }
};

// `googleOverrides` lets tests point the real strategy at a local provider.
const setupAuth = ({ google: googleOverrides = {} } = {}) => {
  const config = loadAuthConfig();

  // JWT Strategy
  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwtSecret
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
    clientID: config.github.clientID,
    clientSecret: config.github.clientSecret,
    callbackURL: config.github.callbackURL
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

  // Google Strategy: optional, registered only when configured. Access and
  // refresh tokens are not stored; sign-in needs only the verified profile.
  passport.unuse('google');
  google = { enabled: false, stateStore: null };
  if (config.google.enabled) {
    const { stateStore: overrideStore, ...endpoints } = googleOverrides;
    const stateStore = overrideStore || createOAuthStateStore({ secure: config.backendUrl.startsWith('https:') });
    const strategy = new GoogleStrategy({
      ...endpoints,
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL,
      scope: GOOGLE_SCOPES,
      store: stateStore
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const { user, info } = await findOrCreateGoogleUser(profile);
        done(null, user, info);
      } catch (error) {
        console.error('Google auth error:', error.name);
        done(error, false);
      }
    });
    // Send the access token in a header, not the userinfo URL query string.
    strategy._oauth2.useAuthorizationHeaderforGET(true);
    passport.use(strategy);
    google = { enabled: true, stateStore };
  }
};

module.exports = { setupAuth, getGoogleAuth, findOrCreateGoogleUser, GOOGLE_SCOPES };

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