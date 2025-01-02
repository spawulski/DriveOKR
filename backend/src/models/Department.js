// backend/src/models/Department.js
const mongoose = require('mongoose');  // Add this line

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Department', departmentSchema);  // Add this line
// // backend/src/models/Department.js
// const mongoose = require('mongoose');

// const departmentSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   description: String,
//   manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
// });