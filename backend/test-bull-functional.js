require('dotenv').config();
const Queue = require('bull');
const Redis = require('ioredis');

console.log('\n🔍 Testing Actual Queue Functionality\n');

const queue = new Queue('functional-test', {
  createClient: (type) => {
    console.log(`Creating ${type}...`);
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
});

console.log('Registering processor...');
queue.process('test-job', async (job) => {
  console.log(`\n✅ PROCESSING JOB: ${job.id}`);
  console.log(`   Data:`, job.data);
  return { processed: true, timestamp: new Date() };
});

// Don't wait for ready event, just try to use it
setTimeout(async () => {
  console.log('\nAttempting to add job (without waiting for ready event)...\n');
  
  try {
    const job = await queue.add('test-job', {
      message: 'Hello from test!',
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Job added successfully!`);
    console.log(`   Job ID: ${job.id}`);
    console.log(`\nWaiting for job to be processed...`);
    
    // Wait for job completion
    const result = await job.finished();
    console.log(`\n✅ JOB COMPLETED!`);
    console.log(`   Result:`, result);
    
    // Check queue counts
    const counts = await queue.getJobCounts();
    console.log(`\nQueue Counts:`, counts);
    
    await queue.close();
    console.log(`\n✅ SUCCESS! Queue is fully functional even without "ready" event!\n`);
    process.exit(0);
    
  } catch (err) {
    console.error(`\n❌ Error:`, err.message);
    console.error(`   Stack:`, err.stack);
    process.exit(1);
  }
}, 3000);

queue.on('completed', (job, result) => {
  console.log(`\n📦 Job ${job.id} completed event fired`);
});

queue.on('failed', (job, err) => {
  console.log(`\n❌ Job ${job.id} failed:`, err.message);
});

setTimeout(() => {
  console.log(`\n⏱️  Overall timeout - exiting\n`);
  process.exit(1);
}, 20000);
