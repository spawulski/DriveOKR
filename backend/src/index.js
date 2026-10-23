// backend/src/index.js
const mongoose = require('mongoose');
require('dotenv').config();

const { setupLogging } = require('./config/logging');
const { createApp } = require('./app');

const app = createApp();
const PORT = process.env.PORT || 4000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
