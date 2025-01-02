// backend/src/models/Department.js
const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});