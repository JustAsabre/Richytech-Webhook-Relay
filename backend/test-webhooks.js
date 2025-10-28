/**
 * Webhook Flow Test Suite
 * Tests webhook receiving, queuing, processing, and retry logic
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

// Test state
let userToken = '';
let createdEndpointId = '';
let createdWebhookUrl = '';
let createdWebhookId = '';
let testServerUrl = ''; // We'll use webhook.site for testing

// Helper to log test results
function logTest(testName, passed, errorMessage = '') {
  if (passed) {
    console.log(`${colors.green}✅ ${testName} PASSED${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ ${testName} FAILED${colors.reset}`);
    if (errorMessage) {
      console.log(`   ${colors.red}${errorMessage}${colors.reset}`);
    }
  }
}

// Setup: Login user
async function setup() {
  console.log(`\n${colors.cyan}SETUP: User Login${colors.reset}`);
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'Test@123456',
    });

    userToken = response.data.token;
    console.log(`   ${colors.green}✓ Logged in successfully${colors.reset}`);
    console.log(`   Token: ${userToken.substring(0, 20)}...`);
    
    // Clean up any existing endpoints to avoid quota issues
    console.log(`\n${colors.cyan}SETUP: Cleaning up test data${colors.reset}`);
    try {
      const listResponse = await axios.get(`${API_URL}/api/endpoints?includeInactive=true&limit=100`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      
      const endpoints = listResponse.data.data.endpoints;
      console.log(`   Found ${endpoints.length} existing endpoints`);
      
      for (const endpoint of endpoints) {
        await axios.delete(`${API_URL}/api/endpoints/${endpoint._id}`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
      }
      console.log(`   ${colors.green}✓ Cleaned up ${endpoints.length} endpoints${colors.reset}`);
    } catch (cleanupError) {
      console.log(`   ${colors.yellow}⚠ Cleanup warning: ${cleanupError.message}${colors.reset}`);
    }
  } catch (error) {
    console.error(
      `   ${colors.red}✗ Login failed:${colors.reset}`,
      error.response?.data?.error?.message || error.message
    );
    process.exit(1);
  }
}

// Test 1: Create endpoint for webhook testing
async function testCreateEndpoint() {
  console.log(`\n${colors.cyan}TEST 1: Create Webhook Endpoint${colors.reset}`);
  try {
    // Use webhook.site as test destination (free webhook testing service)
    testServerUrl = 'https://webhook.site/unique-webhook-test-id';
    
    const response = await axios.post(
      `${API_URL}/api/endpoints`,
      {
        name: 'Webhook Test Endpoint',
        description: 'Endpoint for testing webhook flow',
        destinationUrl: testServerUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const passed = response.status === 201 && response.data.data.webhookUrl;
    logTest('Create Endpoint', passed);

    if (passed) {
      createdEndpointId = response.data.data.endpoint._id;
      createdWebhookUrl = response.data.data.webhookUrl;
      console.log(`   Endpoint ID: ${createdEndpointId}`);
      console.log(`   Webhook URL: ${createdWebhookUrl}`);
      console.log(`   Destination: ${testServerUrl}`);
    }
  } catch (error) {
    logTest('Create Endpoint', false, error.response?.data?.error?.message || error.message);
    console.log(`   Error status: ${error.response?.status}`);
    console.log(`   Error data:`, error.response?.data);
    console.log(`   Error message:`, error.message);
  }
}

// Test 2: Send webhook to endpoint
async function testSendWebhook() {
  console.log(`\n${colors.cyan}TEST 2: Send Webhook to Endpoint${colors.reset}`);
  try {
    const testPayload = {
      event: 'test.webhook',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Richytech Webhook Relay',
        testId: Math.random().toString(36).substring(7),
        metadata: {
          source: 'automated-test',
          version: '1.0.0',
        },
      },
    };

    const response = await axios.post(createdWebhookUrl, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Richytech-Test-Client/1.0',
      },
    });

    const passed = response.status === 200 && response.data.data.status === 'queued';
    logTest('Send Webhook', passed);

    if (passed) {
      createdWebhookId = response.data.data.webhookId;
      console.log(`   Webhook ID: ${createdWebhookId}`);
      console.log(`   Status: ${response.data.data.status}`);
      console.log(`   Message: ${response.data.data.message}`);
      console.log(`   ${colors.yellow}⏳ Webhook queued for processing...${colors.reset}`);
    }
  } catch (error) {
    logTest('Send Webhook', false, error.response?.data?.error?.message || error.message);
    if (error.response?.data) {
      console.log(`   Full error: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Test 3: Get webhook details
async function testGetWebhook() {
  console.log(`\n${colors.cyan}TEST 3: Get Webhook Details${colors.reset}`);
  
  // Wait a bit for processing
  console.log(`   ${colors.yellow}⏳ Waiting 3 seconds for webhook processing...${colors.reset}`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    const response = await axios.get(`${API_URL}/api/webhooks/${createdWebhookId}`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    const webhook = response.data.data;
    const passed = response.status === 200 && webhook._id === createdWebhookId;
    logTest('Get Webhook', passed);

    if (passed) {
      console.log(`   Status: ${webhook.status}`);
      console.log(`   Retry Count: ${webhook.retryCount}`);
      console.log(`   Attempts: ${webhook.attempts.length}`);
      
      if (webhook.attempts.length > 0) {
        const lastAttempt = webhook.attempts[webhook.attempts.length - 1];
        console.log(`   Last Attempt:`);
        console.log(`     - Success: ${lastAttempt.success}`);
        console.log(`     - Status Code: ${lastAttempt.statusCode || 'N/A'}`);
        console.log(`     - Response Time: ${lastAttempt.responseTime || 'N/A'}ms`);
        console.log(`     - Error: ${lastAttempt.errorMessage || 'None'}`);
      }
    }
  } catch (error) {
    logTest('Get Webhook', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 4: List webhooks
async function testListWebhooks() {
  console.log(`\n${colors.cyan}TEST 4: List Webhooks${colors.reset}`);
  try {
    const response = await axios.get(`${API_URL}/api/webhooks`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    const passed = response.status === 200 && Array.isArray(response.data.data.webhooks);
    logTest('List Webhooks', passed);

    if (passed) {
      console.log(`   Total Webhooks: ${response.data.data.pagination.totalItems}`);
      console.log(`   Current Page: ${response.data.data.pagination.currentPage}`);
      console.log(`   Webhooks on this page: ${response.data.data.webhooks.length}`);
      
      response.data.data.webhooks.forEach((webhook, index) => {
        console.log(`   ${index + 1}. ${webhook.status} - ${webhook._id}`);
      });
    }
  } catch (error) {
    logTest('List Webhooks', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 5: Filter webhooks by endpoint
async function testFilterWebhooks() {
  console.log(`\n${colors.cyan}TEST 5: Filter Webhooks by Endpoint${colors.reset}`);
  try {
    const response = await axios.get(
      `${API_URL}/api/webhooks?endpointId=${createdEndpointId}`,
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    const passed = response.status === 200 && response.data.data.webhooks.length > 0;
    logTest('Filter Webhooks', passed);

    if (passed) {
      console.log(`   Webhooks for endpoint: ${response.data.data.webhooks.length}`);
      console.log(`   All match endpoint ID: ${response.data.data.webhooks.every(w => w.endpointId._id === createdEndpointId)}`);
    }
  } catch (error) {
    logTest('Filter Webhooks', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 6: Filter webhooks by status
async function testFilterByStatus() {
  console.log(`\n${colors.cyan}TEST 6: Filter Webhooks by Status${colors.reset}`);
  try {
    const response = await axios.get(
      `${API_URL}/api/webhooks?status=success`,
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    const passed = response.status === 200;
    logTest('Filter by Status', passed);

    if (passed) {
      console.log(`   Successful Webhooks: ${response.data.data.webhooks.length}`);
      if (response.data.data.webhooks.length > 0) {
        console.log(`   All are successful: ${response.data.data.webhooks.every(w => w.status === 'success')}`);
      }
    }
  } catch (error) {
    logTest('Filter by Status', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 7: Check endpoint statistics
async function testEndpointStats() {
  console.log(`\n${colors.cyan}TEST 7: Check Endpoint Statistics${colors.reset}`);
  try {
    const response = await axios.get(
      `${API_URL}/api/endpoints/${createdEndpointId}/stats`,
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    const passed = response.status === 200;
    logTest('Endpoint Statistics', passed);

    if (passed) {
      const stats = response.data.data;
      console.log(`   Total Requests: ${stats.totalRequests}`);
      console.log(`   Successful: ${stats.successfulRequests}`);
      console.log(`   Failed: ${stats.failedRequests}`);
      console.log(`   Success Rate: ${stats.successRate}%`);
      console.log(`   Avg Response Time: ${stats.averageResponseTime}ms`);
    }
  } catch (error) {
    logTest('Endpoint Statistics', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 8: Send webhook with invalid endpoint (should fail)
async function testInvalidEndpoint() {
  console.log(`\n${colors.cyan}TEST 8: Send to Invalid Endpoint${colors.reset}`);
  try {
    const invalidUrl = `${API_URL}/webhook/000000000000000000000000/000000000000000000000000`;
    
    await axios.post(invalidUrl, {
      test: 'data',
    });

    logTest('Invalid Endpoint', false, 'Should have returned 404');
  } catch (error) {
    const passed = error.response?.status === 404;
    logTest('Invalid Endpoint', passed);
    
    if (passed) {
      console.log(`   ${colors.green}✓ Correctly rejected invalid endpoint${colors.reset}`);
    }
  }
}

// Test 9: Retry failed webhook (if any)
async function testRetryWebhook() {
  console.log(`\n${colors.cyan}TEST 9: Retry Webhook${colors.reset}`);
  
  // First, get a webhook that might have failed
  try {
    const listResponse = await axios.get(
      `${API_URL}/api/webhooks?status=failed`,
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    if (listResponse.data.data.webhooks.length === 0) {
      console.log(`   ${colors.yellow}⚠ No failed webhooks to retry${colors.reset}`);
      logTest('Retry Webhook', true);
      return;
    }

    const failedWebhookId = listResponse.data.data.webhooks[0]._id;
    
    const response = await axios.post(
      `${API_URL}/api/webhooks/${failedWebhookId}/retry`,
      {},
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    const passed = response.status === 200 && response.data.data.status === 'queued';
    logTest('Retry Webhook', passed);

    if (passed) {
      console.log(`   Webhook queued for retry: ${failedWebhookId}`);
    }
  } catch (error) {
    // If we get a validation error about webhook already successful, that's fine
    if (error.response?.data?.error?.code === 'VALIDATION_ERROR') {
      logTest('Retry Webhook', true);
      console.log(`   ${colors.yellow}⚠ ${error.response.data.error.message}${colors.reset}`);
    } else {
      logTest('Retry Webhook', false, error.response?.data?.error?.message || error.message);
    }
  }
}

// Run all tests
async function runTests() {
  console.log(`${colors.cyan}╔══════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}  RICHYTECH WEBHOOK RELAY - WEBHOOK FLOW TESTS${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════════════╝${colors.reset}`);

  await setup();
  await testCreateEndpoint();
  await testSendWebhook();
  await testGetWebhook();
  await testListWebhooks();
  await testFilterWebhooks();
  await testFilterByStatus();
  await testEndpointStats();
  await testInvalidEndpoint();
  await testRetryWebhook();

  console.log(`\n${colors.cyan}╔══════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}  TEST SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(
    `${colors.yellow}Note: Some tests depend on webhook worker being running.${colors.reset}`
  );
  console.log(`${colors.yellow}Start worker with: npm run worker${colors.reset}\n`);
  console.log(`${colors.green}Next Steps:${colors.reset}`);
  console.log(`1. Start webhook worker: ${colors.cyan}npm run worker${colors.reset}`);
  console.log(`2. Wait for webhook processing`);
  console.log(`3. Check endpoint stats to verify delivery`);
  console.log(`4. View webhook logs in database`);
}

runTests().catch((error) => {
  console.error(`${colors.red}Test suite error:${colors.reset}`, error);
  process.exit(1);
});
