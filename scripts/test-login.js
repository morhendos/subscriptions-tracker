/**
 * Test Login Script
 * 
 * This script tests the authentication directly against the database
 * to verify that user credentials are valid and working.
 * 
 * Run with: node scripts/test-login.js [email] [password]
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Get credentials from command line or use defaults
const testCredentials = {
  email: process.argv[2] || 'test@example.com',
  password: process.argv[3] || 'password123'
};

// MongoDB connection setup
const config = {
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/subscriptions'
};

// Define User Schema (simplified version of the app's schema)
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  name: String,
  hashedPassword: String,
  roles: [{
    id: String,
    name: String
  }]
});

const User = mongoose.model('User', userSchema);

// Function to compare passwords
async function comparePasswords(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

async function testLogin() {
  try {
    console.log('=== Login Test Utility ===');
    console.log('Testing credentials:');
    console.log(`- Email: ${testCredentials.email}`);
    console.log(`- Password: ${testCredentials.password.replace(/./g, '*')}`);
    
    console.log('\nConnecting to database...');
    console.log(`- URI: ${config.mongodbUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
    
    await mongoose.connect(config.mongodbUri);
    console.log('- Database connected successfully');
    
    // Find user by email
    console.log('\nLooking up user...');
    const user = await User.findOne({ email: testCredentials.email.toLowerCase() });
    
    if (!user) {
      console.error(`- ERROR: User not found with email: ${testCredentials.email}`);
      console.log('\nAvailable users in database:');
      const users = await User.find({}, 'email');
      if (users.length === 0) {
        console.log('- No users found in database');
      } else {
        users.forEach((u, i) => console.log(`- ${i+1}: ${u.email}`));
      }
      return;
    }
    
    console.log(`- Found user: ${user.email}`);
    console.log(`- User ID: ${user._id}`);
    console.log(`- Name: ${user.name || 'Not set'}`);
    console.log(`- Has password hash: ${user.hashedPassword ? 'Yes' : 'No'}`);
    console.log(`- Roles: ${user.roles ? user.roles.map(r => r.name).join(', ') : 'None'}`);
    
    // Verify password
    if (!user.hashedPassword) {
      console.error('- ERROR: User has no password hash!');
      return;
    }
    
    console.log('\nVerifying password...');
    const isValid = await comparePasswords(testCredentials.password, user.hashedPassword);
    
    if (isValid) {
      console.log('- SUCCESS: Password is valid!');
      console.log('\n✓ Authentication test passed - login should work');
    } else {
      console.error('- ERROR: Password is invalid!');
      console.log('\n✗ Authentication test failed - login will not work');
    }
  } catch (error) {
    console.error('\nLogin test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase disconnected');
  }
}

// Run the test
testLogin();
