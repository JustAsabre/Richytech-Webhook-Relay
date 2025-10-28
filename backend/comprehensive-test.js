/**
 * COMPREHENSIVE DEEP TESTING & STRESS TEST SUITE
 * Tests all webhook functionality including edge cases and concurrent load
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let userId = '';  // Store the logged-in user's ID
let testUser = {
  email: 'test@example.com',
  password: 'Test@123456'
};
let testEndpoint = null;

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper functions
const logTest = (name, passed, details = '') => {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const login = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, testUser);
    authToken = response.data.token;
    userId = response.data.data.user._id;  // Store the user ID
    return true;
  } catch (error) {
    return false;
  }
};

const getHeaders = () => ({ Authorization: `Bearer ${authToken}` });

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║   COMPREHENSIVE DEEP TESTING & STRESS TEST SUITE               ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// PHASE 1: BASIC FUNCTIONALITY TESTS
(async () => {
  try {
    console.log('PHASE 1: Basic Functionality Tests');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Test 1: Health Check
    try {
      const health = await axios.get(`${BASE_URL}/health`);
      logTest('Health Check', health.data.success);
    } catch (error) {
      logTest('Health Check', false, error.message);
    }

    // Test 2: Login
    const loginSuccess = await login();
    logTest('User Authentication', loginSuccess);
    if (!loginSuccess) {
      console.log('\n❌ Cannot proceed without authentication');
      process.exit(1);
    }

    // Test 3: Clean up old endpoints
    try {
      const endpoints = await axios.get(`${BASE_URL}/api/endpoints?includeInactive=true&limit=100`, {
        headers: getHeaders()
      });
      
      for (const ep of endpoints.data.data.endpoints) {
        await axios.delete(`${BASE_URL}/api/endpoints/${ep._id}`, {
          headers: getHeaders()
        });
      }
      logTest('Cleanup Old Endpoints', true, `Removed ${endpoints.data.data.endpoints.length} endpoints`);
    } catch (error) {
      logTest('Cleanup Old Endpoints', false, error.message);
    }

    // Test 4: Create test endpoint with webhook.site
    try {
      const webhookSiteId = Math.random().toString(36).substring(7);
      const endpoint = await axios.post(`${BASE_URL}/api/endpoints`, {
        name: 'Deep Test Endpoint',
        description: 'Endpoint for comprehensive testing',
        destinationUrl: `https://webhook.site/${webhookSiteId}`,
        customHeaders: { 'X-Test-Header': 'DeepTest' }
      }, { headers: getHeaders() });
      
      testEndpoint = endpoint.data.data.endpoint;
      logTest('Create Test Endpoint', true, `ID: ${testEndpoint._id}`);
    } catch (error) {
      logTest('Create Test Endpoint', false, error.message);
      process.exit(1);
    }

    await sleep(2000);

    console.log('\n\nPHASE 2: Single Webhook Processing Tests');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Test 5: Send simple webhook
    try {
      const payload = {
        event: 'test.simple',
        data: { message: 'Simple test' },
        timestamp: new Date().toISOString()
      };
      
      const response = await axios.post(
        `${BASE_URL}/webhook/${userId}/${testEndpoint._id}`,
        payload
      );
      
      logTest('Send Simple Webhook', 
        response.data.success && response.data.data.status === 'queued',
        `Webhook ID: ${response.data.data.webhookId}`
      );
      
      // Wait for processing
      await sleep(8000);
      
      // Check webhook status
      const webhook = await axios.get(
        `${BASE_URL}/api/webhooks/${response.data.data.webhookId}`,
        { headers: getHeaders() }
      );
      
      const w = webhook.data.data;
      logTest('Webhook Processed', 
        w.attempts.length > 0,
        `Status: ${w.status}, Attempts: ${w.attempts.length}`
      );
      
      logTest('Delivery Attempt Logged',
        w.attempts[0] && w.attempts[0].attemptNumber === 1,
        `Response Time: ${w.attempts[0]?.responseTime}ms`
      );
      
    } catch (error) {
      logTest('Send Simple Webhook', false, error.message);
    }

    await sleep(2000);

    // Test 6: Large payload webhook
    try {
      const largePayload = {
        event: 'test.large',
        data: {
          items: Array(100).fill(null).map((_, i) => ({
            id: i,
            name: `Item ${i}`,
            description: 'A'.repeat(100),
            metadata: { created: new Date().toISOString() }
          }))
        }
      };
      
      const response = await axios.post(
        `${BASE_URL}/webhook/${userId}/${testEndpoint._id}`,
        largePayload
      );
      
      logTest('Large Payload Webhook',
        response.data.success,
        `Payload size: ${JSON.stringify(largePayload).length} bytes`
      );
    } catch (error) {
      logTest('Large Payload Webhook', false, error.message);
    }

    await sleep(2000);

    // Test 7: Special characters in payload
    try {
      const specialPayload = {
        event: 'test.special',
        message: 'Special chars: ñ é ü 中文 🎉 <script>alert("test")</script>',
        data: { 'key-with-dash': 'value', 'key.with.dot': 'value' }
      };
      
      const response = await axios.post(
        `${BASE_URL}/webhook/${userId}/${testEndpoint._id}`,
        specialPayload
      );
      
      logTest('Special Characters Webhook', response.data.success);
    } catch (error) {
      logTest('Special Characters Webhook', false, error.message);
    }

    await sleep(2000);

    console.log('\n\nPHASE 3: Edge Cases & Error Handling');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Test 8: Invalid endpoint ID
    try {
      await axios.post(
        `${BASE_URL}/webhook/${userId}/invalid-endpoint-id`,
        { test: 'data' }
      );
      logTest('Invalid Endpoint ID', false, 'Should have failed');
    } catch (error) {
      logTest('Invalid Endpoint ID Rejection',
        error.response?.status === 404 || error.response?.status === 400
      );
    }

    // Test 9: Invalid user ID
    try {
      await axios.post(
        `${BASE_URL}/webhook/invalid-user-id/${testEndpoint._id}`,
        { test: 'data' }
      );
      logTest('Invalid User ID', false, 'Should have failed');
    } catch (error) {
      logTest('Invalid User ID Rejection',
        error.response?.status === 404 || error.response?.status === 400
      );
    }

    // Test 10: Empty payload
    try {
      const response = await axios.post(
        `${BASE_URL}/webhook/${userId}/${testEndpoint._id}`,
        {}
      );
      logTest('Empty Payload Handling', response.data.success);
    } catch (error) {
      logTest('Empty Payload Handling', false, error.message);
    }

    await sleep(2000);

    // Test 11: Quota limit test
    try {
      const endpoint2 = await axios.post(`${BASE_URL}/api/endpoints`, {
        name: 'Quota Test Endpoint 2',
        destinationUrl: 'https://webhook.site/quota-test-2'
      }, { headers: getHeaders() });

      const endpoint3Result = await axios.post(`${BASE_URL}/api/endpoints`, {
        name: 'Quota Test Endpoint 3',
        destinationUrl: 'https://webhook.site/quota-test-3'
      }, { headers: getHeaders() })
      .catch(err => err.response);

      logTest('Endpoint Quota Enforcement',
        endpoint3Result.status === 403 || endpoint3Result.status === 400,
        'Free tier limit: 2 endpoints'
      );
    } catch (error) {
      logTest('Endpoint Quota Enforcement', false, error.message);
    }

    console.log('\n\nPHASE 4: Concurrent Webhook Stress Test');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Test 12: Concurrent webhooks
    const CONCURRENT_COUNT = 50;
    console.log(`Preparing to send ${CONCURRENT_COUNT} concurrent webhooks...`);
    
    try {
      const startTime = Date.now();
      const webhookPromises = [];
      
      for (let i = 0; i < CONCURRENT_COUNT; i++) {
        const payload = {
          event: `stress.test.${i}`,
          batchId: 'concurrent-test',
          index: i,
          timestamp: new Date().toISOString(),
          data: { iteration: i, random: Math.random() }
        };
        
        webhookPromises.push(
          axios.post(
            `${BASE_URL}/webhook/${userId}/${testEndpoint._id}`,
            payload
          ).catch(err => ({ error: err.message }))
        );
      }
      
      const responses = await Promise.all(webhookPromises);
      const successful = responses.filter(r => r.data?.success).length;
      const failed = responses.filter(r => r.error).length;
      const duration = Date.now() - startTime;
      
      logTest(`Send ${CONCURRENT_COUNT} Concurrent Webhooks`,
        successful > 0,
        `Success: ${successful}, Failed: ${failed}, Time: ${duration}ms (${(CONCURRENT_COUNT / (duration / 1000)).toFixed(2)} req/sec)`
      );
      
      // Wait for processing
      console.log(`\nWaiting 15 seconds for worker to process ${successful} webhooks...`);
      await sleep(15000);
      
      // Check how many were processed
      const webhooks = await axios.get(
        `${BASE_URL}/api/webhooks?limit=100&endpointId=${testEndpoint._id}`,
        { headers: getHeaders() }
      );
      
      const processed = webhooks.data.data.webhooks.filter(w => w.attempts.length > 0).length;
      const total = webhooks.data.data.webhooks.length;
      
      logTest('Concurrent Webhooks Processed',
        processed > 0,
        `Processed: ${processed}/${total} (${((processed/total)*100).toFixed(1)}%)`
      );
      
    } catch (error) {
      logTest('Concurrent Stress Test', false, error.message);
    }

    await sleep(2000);

    console.log('\n\nPHASE 5: Endpoint Statistics Validation');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Test 13: Check endpoint statistics
    try {
      const stats = await axios.get(
        `${BASE_URL}/api/endpoints/${testEndpoint._id}/stats`,
        { headers: getHeaders() }
      );
      
      const s = stats.data.data;
      logTest('Endpoint Statistics Tracking',
        s.totalRequests > 0,
        `Total: ${s.totalRequests}, Success: ${s.successfulRequests}, Failed: ${s.failedRequests}, Rate: ${s.successRate}%`
      );
      
      logTest('Average Response Time Calculated',
        s.averageResponseTime !== undefined && s.averageResponseTime !== null,
        `Avg: ${s.averageResponseTime}ms`
      );
      
    } catch (error) {
      logTest('Endpoint Statistics', false, error.message);
    }

    console.log('\n\nPHASE 6: List and Filter Tests');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Test 14: List webhooks with pagination
    try {
      const page1 = await axios.get(
        `${BASE_URL}/api/webhooks?limit=10&page=1`,
        { headers: getHeaders() }
      );
      
      logTest('Webhook List Pagination',
        page1.data.data.webhooks.length <= 10 && page1.data.data.pagination,
        `Page 1: ${page1.data.data.webhooks.length} webhooks`
      );
    } catch (error) {
      logTest('Webhook List Pagination', false, error.message);
    }

    // Test 15: Filter webhooks by status
    try {
      const filtered = await axios.get(
        `${BASE_URL}/api/webhooks?status=failed&limit=50`,
        { headers: getHeaders() }
      );
      
      const allFailed = filtered.data.data.webhooks.every(w => w.status === 'failed');
      logTest('Filter by Status',
        allFailed || filtered.data.data.webhooks.length === 0,
        `Found ${filtered.data.data.webhooks.length} failed webhooks`
      );
    } catch (error) {
      logTest('Filter by Status', false, error.message);
    }

    // Test 16: Filter by endpoint
    try {
      const filtered = await axios.get(
        `${BASE_URL}/api/webhooks?endpointId=${testEndpoint._id}&limit=100`,
        { headers: getHeaders() }
      );
      
      logTest('Filter by Endpoint',
        filtered.data.data.webhooks.length > 0,
        `Found ${filtered.data.data.webhooks.length} webhooks for this endpoint`
      );
    } catch (error) {
      logTest('Filter by Endpoint', false, error.message);
    }

    console.log('\n\nPHASE 7: System Performance Metrics');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Test 17: Response time analysis
    try {
      const measurements = [];
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await axios.post(
          `${BASE_URL}/webhook/${userId}/${testEndpoint._id}`,
          { test: 'performance', iteration: i }
        );
        measurements.push(Date.now() - start);
        await sleep(100);
      }
      
      const avg = measurements.reduce((a, b) => a + b) / measurements.length;
      const min = Math.min(...measurements);
      const max = Math.max(...measurements);
      
      logTest('API Response Time',
        avg < 1000,
        `Avg: ${avg.toFixed(0)}ms, Min: ${min}ms, Max: ${max}ms`
      );
    } catch (error) {
      logTest('API Response Time', false, error.message);
    }

    // Wait for final processing
    console.log('\nWaiting 10 seconds for final webhook processing...');
    await sleep(10000);

    // FINAL RESULTS
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                  COMPREHENSIVE TEST RESULTS                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    console.log(`Total Tests Run: ${results.passed + results.failed}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`);
    
    if (results.failed > 0) {
      console.log('Failed Tests:');
      results.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  ❌ ${t.name}: ${t.details}`);
      });
      console.log('');
    }

    // Final endpoint stats
    try {
      const finalStats = await axios.get(
        `${BASE_URL}/api/endpoints/${testEndpoint._id}/stats`,
        { headers: getHeaders() }
      );
      
      const s = finalStats.data.data;
      console.log('Final Endpoint Statistics:');
      console.log(`  Total Requests: ${s.totalRequests}`);
      console.log(`  Successful: ${s.successfulRequests}`);
      console.log(`  Failed: ${s.failedRequests}`);
      console.log(`  Success Rate: ${s.successRate}%`);
      console.log(`  Avg Response Time: ${s.averageResponseTime}ms\n`);
    } catch (error) {
      console.log('Could not fetch final stats:', error.message);
    }

    console.log('╔════════════════════════════════════════════════════════════════╗');
    if (results.failed === 0) {
      console.log('║         🎉 ALL TESTS PASSED - SYSTEM FULLY OPERATIONAL! 🎉    ║');
    } else if (results.passed > results.failed) {
      console.log('║    ⚠️  MOST TESTS PASSED - MINOR ISSUES DETECTED              ║');
    } else {
      console.log('║         ❌ CRITICAL ISSUES - IMMEDIATE ATTENTION NEEDED        ║');
    }
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    process.exit(results.failed === 0 ? 0 : 1);

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
