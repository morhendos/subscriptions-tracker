import clientPromise from '.';

async function test() {
  try {
    const mongoose = await clientPromise;
    console.log('MongoDB connected successfully!');
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
    process.exit(1);
  }
}

test();
