require('dotenv').config();
const Queue = require('bull');

console.log('\n🔍 Testing Bull Simple Approach\n');

// According to Bull docs, you can pass Redis connection string directly 
// IF it's in a specific format that Bull's internal Redis client can parse
const queue = new Queue('test-queue', process.env.REDIS_URL);

let connected = false;

queue.on('ready', () => {
  connected = true;
  console.log('✅ QUEUE READY!\n');
  queue.close().then(() => process.exit(0));
});

queue.on('error', (err) => {
  console.error('❌ Queue Error:', err.message);
  if (!connected) {
    console.log('\n💡 Diagnosis: Bull cannot parse this REDIS_URL format');
    console.log('   Recommendation: Use createClient with ioredis\n');
  }
});

setTimeout(() => {
  if (!connected) {
    console.log('\n⏱️  Timeout - trying alternative approach...\n');
    queue.close();
    
    // Try alternative: manually configure Redis options
    const Redis = require('ioredis');
    
    console.log('Alternative: Using ioredis with createClient...\n');
    
    const queue2 = new Queue('test-queue-2', {
      createClient: function(type, opts) {
        console.log(`Creating ${type} connection...`);
        return new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        });
      }
    });
    
    queue2.on('ready', () => {
      console.log('\n✅ ALTERNATIVE METHOD WORKED!\n');
      queue2.close().then(() => process.exit(0));
    });
    
    queue2.on('error', (err) => {
      console.error('❌ Alternative also failed:', err.message);
    });
    
    setTimeout(() => {
      console.log('\n❌ Both methods failed\n');
      process.exit(1);
    }, 10000);
  }
}, 5000);
