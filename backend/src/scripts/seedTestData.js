// backend/src/scripts/seedTestData.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Team = require('../models/Team');
const Objective = require('../models/Objective');
const KeyResult = require('../models/KeyResult');

const MONGODB_URI = 'mongodb://localhost:27017/okr_platform';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Team.deleteMany({}),
      Objective.deleteMany({}),
      KeyResult.deleteMany({})
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

// Create objectives
const objectives = await Objective.create([
  // Organization Objective
  {
    title: 'Improve Platform Stability',
    description: 'Enhance overall system reliability and performance',
    type: 'organization',
    owner: users[0]._id, // Admin
    status: 'active',
    timeframe: {
      quarter: 1,
      year: 2025
    }
  },
  // Department Objective (Engineering)
  {
    title: 'Launch New Feature Set',
    description: 'Deploy major platform updates',
    type: 'department',
    department: departments[0]._id,  // Engineering department
    owner: users[1]._id, // Engineering Manager
    status: 'active',
    timeframe: {
      quarter: 1,
      year: 2025
    }
  },
  // Team Objective (Frontend Team)
  {
    title: 'Improve Frontend Performance',
    description: 'Optimize application loading and rendering',
    type: 'team',
    department: departments[0]._id,  // Engineering department
    team: teams[0]._id,  // Frontend team
    owner: users[3]._id, // Frontend Lead
    status: 'active',
    timeframe: {
      quarter: 1,
      year: 2025
    }
  },
  // Individual Objective (Frontend Dev)
  {
    title: 'Implement Component Library',
    description: 'Create reusable component system',
    type: 'individual',
    department: departments[0]._id,  // Engineering department
    owner: users[5]._id, // Frontend Dev 1
    status: 'active',
    timeframe: {
      quarter: 1,
      year: 2025
    }
  }
]);
console.log('Created objectives');

// Create key results
const keyResults = await KeyResult.create([
  // KRs for Organization Objective
  {
    objective: objectives[0]._id,
    title: 'Reduce System Downtime',
    description: 'Minimize unplanned outages',
    metricType: 'percentage',
    startValue: 99,
    targetValue: 99.9,
    currentValue: 99.5,
    unit: '%',
    confidenceLevel: 'high'
  },
  {
    objective: objectives[0]._id,
    title: 'Response Time Improvement',
    description: 'Decrease average API response time',
    metricType: 'number',
    startValue: 500,
    targetValue: 200,
    currentValue: 350,
    unit: 'ms',
    confidenceLevel: 'medium'
  },
  // KRs for Department Objective
  {
    objective: objectives[1]._id,
    title: 'Feature Implementation',
    description: 'Complete new feature development',
    metricType: 'number',
    startValue: 0,
    targetValue: 5,
    currentValue: 2,
    unit: 'features',
    confidenceLevel: 'high'
  },
  {
    objective: objectives[1]._id,
    title: 'Code Coverage',
    description: 'Increase test coverage for new features',
    metricType: 'percentage',
    startValue: 75,
    targetValue: 90,
    currentValue: 82,
    unit: '%',
    confidenceLevel: 'medium'
  },
  // KRs for Team Objective
  {
    objective: objectives[2]._id,
    title: 'Page Load Time',
    description: 'Reduce average page load time',
    metricType: 'number',
    startValue: 3.5,
    targetValue: 2.0,
    currentValue: 2.8,
    unit: 'seconds',
    confidenceLevel: 'medium'
  },
  {
    objective: objectives[2]._id,
    title: 'Lighthouse Score',
    description: 'Improve average Lighthouse performance score',
    metricType: 'number',
    startValue: 75,
    targetValue: 95,
    currentValue: 85,
    unit: 'points',
    confidenceLevel: 'high'
  },
  // KRs for Individual Objective
  {
    objective: objectives[3]._id,
    title: 'Component Creation',
    description: 'Build reusable components',
    metricType: 'number',
    startValue: 0,
    targetValue: 20,
    currentValue: 8,
    unit: 'components',
    confidenceLevel: 'high'
  },
  {
    objective: objectives[3]._id,
    title: 'Documentation Coverage',
    description: 'Document all components',
    metricType: 'percentage',
    startValue: 0,
    targetValue: 100,
    currentValue: 40,
    unit: '%',
    confidenceLevel: 'medium'
  }
]);
console.log('Created key results');

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedData();