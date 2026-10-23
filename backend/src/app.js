// backend/src/app.js
const express = require('express');
const passport = require('passport');
const cors = require('cors');

const { setupAuth } = require('./config/auth');
const routes = require('./routes');

const createApp = (authOptions) => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize Passport and restore authentication state if any
  app.use(passport.initialize());
  setupAuth(authOptions); // Make sure this is called AFTER passport.initialize()

  // Routes
  app.use('/api', routes);

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
  });

  return app;
};

module.exports = { createApp };
