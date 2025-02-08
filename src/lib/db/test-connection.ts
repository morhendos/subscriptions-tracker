import { connectToDatabase, disconnectFromDatabase } from './mongodb';

async function testConnection() {
  try {
    await connectToDatabase();
    console.log('✅ MongoDB connection test successful!');
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error);
  } finally {
    await disconnectFromDatabase();
  }
}

testConnection();
