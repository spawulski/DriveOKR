// backend/src/index.js
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const cors = require('cors');
require('dotenv').config();

const { setupLogging } = require('./config/logging');
const { setupAuth } = require('./config/auth');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport and restore authentication state if any
app.use(passport.initialize());
// setupAuth(); // Make sure this is called AFTER passport.initialize()
// Pass the app instance to setupAuth
setupAuth(app);

// Routes
app.use('/api', routes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});