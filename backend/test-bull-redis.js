require('dotenv').config();
const Queue = require('bull');
const Redis = require('ioredis');

console.log('\n🔍 Testing Bull + ioredis Integration\n');
console.log('REDIS_URL:', process.env.REDIS_URL ? 'Loaded ✅' : 'Missing ❌');

// Correct pattern for Bull with custom Redis client
const queueOptions = {
  createClient: function (type) {
    console.log(`Creating ${type} client...`);
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    
    client.on('connect', () => {
      console.log(`  ✅ ${type} client connected`);
    });
    
    client.on('error', (err) => {
      console.log(`  ❌ ${type} client error:`, err.message);
    });
    
    return client;
  },
};

const queue = new Queue('webhook-processing', queueOptions);

console.log('\nWaiting for queue to initialize...\n');

queue.on('ready', () => {
  console.log('\n✅ QUEUE IS READY!\n');
  
  // Try adding a test job
  queue.add('test-job', { test: 'data', timestamp: new Date() })
    .then(job => {
      console.log('✅ Test job added successfully!');
      console.log('   Job ID:', job.id);
      return queue.getJobCounts();
    })
    .then(counts => {
      console.log('\nQueue Status:');
      console.log('   Waiting:', counts.waiting);
      console.log('   Active:', counts.active);
      console.log('   Completed:', counts.completed);
      console.log('   Failed:', counts.failed);
      return queue.close();
    })
    .then(() => {
      console.log('\n✅ Test completed successfully!\n');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Error:', err.message);
      process.exit(1);
    });
});

queue.on('error', (err) => {
  console.error('❌ Queue error:', err.message);
});

// Timeout
setTimeout(() => {
  console.error('\n⏱️  Connection timeout - queue not ready\n');
  process.exit(1);
}, 15000);
