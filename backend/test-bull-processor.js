require('dotenv').config();
const Queue = require('bull');
const Redis = require('ioredis');

console.log('\n🔍 Deep Bull Investigation\n');
console.log('Testing if Bull needs a processor to create all connections...\n');

let clientTypes = [];

const queue = new Queue('test-queue', {
  createClient: function(type) {
    clientTypes.push(type);
    console.log(`${clientTypes.length}. Creating "${type}" connection...`);
    
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    
    client.on('connect', () => {
      console.log(`   ✅ ${type} connected!`);
    });
    
    client.on('error', (err) => {
      console.log(`   ❌ ${type} error: ${err.message.substring(0, 50)}`);
    });
    
    return client;
  }
});

// Register a simple processor
console.log('Registering a processor...\n');
queue.process('test-job', async (job) => {
  console.log('Processing job:', job.id);
  return { success: true };
});

queue.on('ready', () => {
  console.log(`\n✅ QUEUE READY! Created ${clientTypes.length} connection(s): ${clientTypes.join(', ')}\n`);
  queue.close().then(() => process.exit(0));
});

queue.on('error', (err) => {
  console.error('❌ Queue error:', err.message);
});

setTimeout(() => {
  console.log(`\n⏱️  Timeout after 15s`);
  console.log(`Created ${clientTypes.length} connection(s): ${clientTypes.join(', ')}`);
  console.log('\n💡 Analysis: Bull should create 3 connections (client, subscriber, bclient)');
  console.log('   If only 1-2 were created, the "ready" event will never fire\n');
  process.exit(1);
}, 15000);
