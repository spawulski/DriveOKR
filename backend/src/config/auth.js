// backend/src/config/auth.js
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const User = require('../models/User');

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: `${process.env.OKTA_DOMAIN}/oauth2/default`,
  clientId: process.env.OKTA_CLIENT_ID
});

const setupAuth = (app) => {  // Accept app as parameter
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

  // GitHub Strategy
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'http://localhost:4000/api/auth/github/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ githubId: profile.id });
      
      if (user) {
        user.lastLogin = new Date();
        user.githubAccessToken = accessToken;
        await user.save();
        return done(null, user);
      }
      
      user = await new User({
        githubId: profile.id,
        email: profile.emails?.[0]?.value || `${profile.username}@github.com`,
        name: profile.displayName || profile.username,
        role: 'individual',
        githubAccessToken: accessToken,
        authProvider: 'github'
      }).save();
      
      done(null, user);
    } catch (error) {
      console.error('GitHub auth error:', error);
      done(error, false);
    }
  }));

  // Add Okta JWT verification middleware
  app.use(async (req, res, next) => {
    try {
      if (!req.headers.authorization) return next();
      
      const accessToken = req.headers.authorization.trim().split(' ')[1];
      const jwt = await oktaJwtVerifier.verifyAccessToken(accessToken, 'api://default');
      
      if (jwt.claims.sub) {
        const user = await User.findOne({ oktaId: jwt.claims.sub });
        if (user) {
          req.user = user;
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  });
};

module.exports = { setupAuth };