/**
 * Create Test User Script
 * 
 * This script creates a test user in the database for local development.
 * Run with: node scripts/create-test-user.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Configuration
const config = {
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/subscriptions',
  testUser: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  }
};

// Define User Schema (simplified version of the app's schema)
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  hashedPassword: {
    type: String,
    required: true
  },
  roles: {
    type: [{
      id: String,
      name: String
    }],
    default: [{ id: '1', name: 'user' }]
  },
  emailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create the User model
const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    console.log('Connecting to database:', config.mongodbUri);
    await mongoose.connect(config.mongodbUri);
    console.log('Database connected successfully');

    // Check if user already exists
    const existingUser = await User.findOne({ email: config.testUser.email });
    if (existingUser) {
      console.log(`Test user already exists: ${config.testUser.email}`);
      
      // Update password anyway to ensure it's correct
      const hashedPassword = await bcrypt.hash(config.testUser.password, 10);
      await User.updateOne(
        { email: config.testUser.email },
        { $set: { hashedPassword } }
      );
      console.log('Password updated for existing user');
    } else {
      // Create new test user
      const hashedPassword = await bcrypt.hash(config.testUser.password, 10);
      const user = new User({
        email: config.testUser.email,
        name: config.testUser.name,
        hashedPassword,
        roles: [{ id: '1', name: 'user' }],
        emailVerified: true
      });
      
      await user.save();
      console.log(`Test user created: ${config.testUser.email}`);
    }
    
    console.log('\nTest user details:');
    console.log(`- Email: ${config.testUser.email}`);
    console.log(`- Password: ${config.testUser.password}`);
    console.log('\nYou can now log in with these credentials in the application.');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected');
  }
}

// Run the function
createTestUser();
