import { connectToDatabase } from './mongodb';

async function testConnection() {
  console.log('Testing MongoDB connection...');
  try {
    const conn = await connectToDatabase();
    console.log('Connection successful!', conn.host);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();