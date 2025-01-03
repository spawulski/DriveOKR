// backend/src/scripts/seedTestData.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Team = require('../models/Team');

const MONGODB_URI = 'mongodb://localhost:27017/okr_platform';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Team.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create test users
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        isAdmin: true,
        githubId: 'github_1',  // Added githubId
      },
      {
        name: 'Engineering Manager',
        email: 'eng.manager@example.com',
        role: 'manager',
        githubId: 'github_2',
      },
      {
        name: 'Sales Manager',
        email: 'sales.manager@example.com',
        role: 'manager',
        githubId: 'github_3',
      },
      {
        name: 'Frontend Lead',
        email: 'frontend.lead@example.com',
        role: 'team_lead',
        githubId: 'github_4',
      },
      {
        name: 'Backend Lead',
        email: 'backend.lead@example.com',
        role: 'team_lead',
        githubId: 'github_5',
      },
      {
        name: 'Frontend Dev 1',
        email: 'frontend1@example.com',
        role: 'individual',
        githubId: 'github_6',
      },
      {
        name: 'Frontend Dev 2',
        email: 'frontend2@example.com',
        role: 'individual',
        githubId: 'github_7',
      },
      {
        name: 'Backend Dev 1',
        email: 'backend1@example.com',
        role: 'individual',
        githubId: 'github_8',
      },
      {
        name: 'Backend Dev 2',
        email: 'backend2@example.com',
        role: 'individual',
        githubId: 'github_9',
      },
    ]);
    console.log('Created test users');

    // Rest of the code remains the same...
    // Create departments
    const departments = await Department.create([
      {
        name: 'Engineering',
        description: 'Software Development Department',
        manager: users[1]._id, // Engineering Manager
      },
      {
        name: 'Sales',
        description: 'Sales and Business Development',
        manager: users[2]._id, // Sales Manager
      },
    ]);
    console.log('Created departments');

    // Create teams
    const teams = await Team.create([
      {
        name: 'Frontend Team',
        department: departments[0]._id, // Engineering
        teamLead: users[3]._id, // Frontend Lead
        members: [
          users[5]._id, // Frontend Dev 1
          users[6]._id, // Frontend Dev 2
        ],
      },
      {
        name: 'Backend Team',
        department: departments[0]._id, // Engineering
        teamLead: users[4]._id, // Backend Lead
        members: [
          users[7]._id, // Backend Dev 1
          users[8]._id, // Backend Dev 2
        ],
      },
    ]);
    console.log('Created teams');

    // Update users with their department and team assignments
    await Promise.all([
      // Engineering department users
      User.updateMany(
        { _id: { $in: [users[1]._id, users[3]._id, users[4]._id, users[5]._id, users[6]._id, users[7]._id, users[8]._id] } },
        { department: departments[0]._id }
      ),
      // Sales department users
      User.updateMany(
        { _id: users[2]._id },
        { department: departments[1]._id }
      ),
      // Frontend team users
      User.updateMany(
        { _id: { $in: [users[3]._id, users[5]._id, users[6]._id] } },
        { team: teams[0]._id }
      ),
      // Backend team users
      User.updateMany(
        { _id: { $in: [users[4]._id, users[7]._id, users[8]._id] } },
        { team: teams[1]._id }
      ),
    ]);
    console.log('Updated user assignments');

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedData();