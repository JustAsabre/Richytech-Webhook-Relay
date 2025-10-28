/**
 * Database Connection Test Script
 * Run this to verify MongoDB and Redis connections
 */

require('dotenv').config();
const mongoose = require('mongoose');
const redis = require('redis');

console.log('🔍 Testing Database Connections...\n');

// Test MongoDB
async function testMongoDB() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('URI:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') || 'NOT SET');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB: Connected successfully!');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    
    await mongoose.connection.close();
    console.log('✅ MongoDB: Connection closed\n');
    return true;
  } catch (error) {
    console.error('❌ MongoDB: Connection failed!');
    console.error('   Error:', error.message);
    console.log('');
    return false;
  }
}

// Test Redis
async function testRedis() {
  try {
    console.log('Testing Redis connection...');
    console.log('URL:', process.env.REDIS_URL?.replace(/:([^@]+)@/, ':****@') || 'NOT SET');
    
    const client = redis.createClient({
      url: process.env.REDIS_URL,
    });

    await client.connect();
    console.log('✅ Redis: Connected successfully!');
    
    // Test a simple operation
    await client.set('test_key', 'test_value');
    const value = await client.get('test_key');
    console.log(`   Test operation: ${value === 'test_value' ? 'PASSED' : 'FAILED'}`);
    await client.del('test_key');
    
    await client.quit();
    console.log('✅ Redis: Connection closed\n');
    return true;
  } catch (error) {
    console.error('❌ Redis: Connection failed!');
    console.error('   Error:', error.message);
    console.log('');
    return false;
  }
}

// Run tests
(async () => {
  console.log('═══════════════════════════════════════════');
  console.log('  DATABASE CONNECTION TEST');
  console.log('═══════════════════════════════════════════\n');

  const mongoSuccess = await testMongoDB();
  const redisSuccess = await testRedis();

  console.log('═══════════════════════════════════════════');
  console.log('  RESULTS');
  console.log('═══════════════════════════════════════════');
  console.log(`MongoDB: ${mongoSuccess ? '✅ READY' : '❌ NOT READY'}`);
  console.log(`Redis:   ${redisSuccess ? '✅ READY' : '❌ NOT READY'}`);
  console.log('═══════════════════════════════════════════\n');

  if (mongoSuccess && redisSuccess) {
    console.log('🎉 All databases connected successfully!');
    console.log('You can now start the server with: npm start\n');
  } else {
    console.log('⚠️  Please fix the connection issues above.');
    console.log('Check your .env file and connection strings.\n');
  }

  process.exit(mongoSuccess && redisSuccess ? 0 : 1);
})();
