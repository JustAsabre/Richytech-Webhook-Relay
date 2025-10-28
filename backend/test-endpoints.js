/**
 * Endpoint Management Tests
 * Tests all endpoint endpoints
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  white: '\x1b[37m',
  magenta: '\x1b[35m',
};

let userToken = '';
let testsPassed = 0;
let testsFailed = 0;
let createdEndpointId = '';
let createdEndpointSecret = '';
let createdWebhookUrl = '';

// Helper function to log test results
function logTest(testName, passed, message = '') {
  if (passed) {
    console.log(`${colors.green}✅ ${testName} PASSED${colors.reset}`);
    testsPassed++;
  } else {
    console.log(`${colors.red}❌ ${testName} FAILED${colors.reset}`);
    if (message) console.log(`   ${colors.yellow}${message}${colors.reset}`);
    testsFailed++;
  }
}

// Test 0: Login to get token
async function loginUser() {
  console.log(`\n${colors.cyan}SETUP: User Login${colors.reset}`);
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'Test@123456',
    });

    userToken = response.data.token;
    console.log(`   ${colors.green}✓ Logged in successfully${colors.reset}`);
    console.log(`   Token: ${userToken.substring(0, 20)}...`);
  } catch (error) {
    console.log(`   ${colors.red}✗ Login failed: ${error.response?.data?.error?.message || error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Test 1: Create Endpoint
async function testCreateEndpoint() {
  console.log(`\n${colors.cyan}TEST 1: Create Webhook Endpoint${colors.reset}`);
  try {
    const response = await axios.post(
      `${API_URL}/api/endpoints`,
      {
        name: 'Test Webhook Endpoint',
        description: 'Endpoint for automated testing',
        destinationUrl: 'https://webhook.site/unique-id-here',
        customHeaders: {
          'X-Custom-Header': 'test-value',
          'Authorization': 'Bearer test-token',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    const passed = response.status === 201 && response.data.data.endpoint._id;
    logTest('Create Endpoint', passed);
    
    if (passed) {
      createdEndpointId = response.data.data.endpoint._id;
      createdEndpointSecret = response.data.data.endpoint.secret;
      createdWebhookUrl = response.data.data.endpoint.webhookUrl;
      console.log(`   Endpoint ID: ${createdEndpointId}`);
      console.log(`   Webhook URL: ${createdWebhookUrl}`);
      console.log(`   Secret: ${createdEndpointSecret.substring(0, 20)}...`);
      console.log(`   Destination: ${response.data.data.endpoint.destinationUrl}`);
      console.log(`   ${colors.yellow}⚠️  ${response.data.message}${colors.reset}`);
    } else {
      console.log(`   ${colors.yellow}Response: ${JSON.stringify(response.data)}${colors.reset}`);
    }
  } catch (error) {
    console.log(`   ${colors.red}Error: ${JSON.stringify(error.response?.data)}${colors.reset}`);
    logTest('Create Endpoint', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 2: List Endpoints
async function testListEndpoints() {
  console.log(`\n${colors.cyan}TEST 2: List Endpoints${colors.reset}`);
  try {
    const response = await axios.get(`${API_URL}/api/endpoints`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    const passed = response.status === 200 && Array.isArray(response.data.data.endpoints);
    logTest('List Endpoints', passed);
    
    if (passed) {
      console.log(`   Found ${response.data.data.endpoints.length} endpoint(s)`);
      console.log(`   Quota: ${response.data.data.quota.used}/${response.data.data.quota.limit}`);
      response.data.data.endpoints.forEach((endpoint, index) => {
        console.log(`   ${index + 1}. ${endpoint.name}`);
        console.log(`      URL: ${endpoint.webhookUrl}`);
        console.log(`      Success Rate: ${endpoint.successRate}%`);
      });
    }
  } catch (error) {
    logTest('List Endpoints', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 3: Get Single Endpoint
async function testGetEndpoint() {
  console.log(`\n${colors.cyan}TEST 3: Get Single Endpoint${colors.reset}`);
  try {
    const response = await axios.get(`${API_URL}/api/endpoints/${createdEndpointId}`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    const passed = response.status === 200 && response.data.data._id === createdEndpointId;
    logTest('Get Single Endpoint', passed);
    
    if (passed) {
      console.log(`   Name: ${response.data.data.name}`);
      console.log(`   Description: ${response.data.data.description || 'N/A'}`);
      console.log(`   Destination: ${response.data.data.destinationUrl}`);
      console.log(`   Active: ${response.data.data.isActive}`);
      console.log(`   Created: ${new Date(response.data.data.createdAt).toLocaleString()}`);
      console.log(`   Custom Headers: ${Object.keys(response.data.data.customHeaders || {}).length} header(s)`);
    }
  } catch (error) {
    logTest('Get Single Endpoint', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 4: Update Endpoint
async function testUpdateEndpoint() {
  console.log(`\n${colors.cyan}TEST 4: Update Endpoint${colors.reset}`);
  try {
    const response = await axios.put(
      `${API_URL}/api/endpoints/${createdEndpointId}`,
      {
        name: 'Updated Test Endpoint',
        description: 'Updated description for testing',
        destinationUrl: 'https://webhook.site/updated-unique-id',
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    const passed = response.status === 200;
    logTest('Update Endpoint', passed);
    
    if (passed) {
      console.log(`   Updated Name: ${response.data.data.name}`);
      console.log(`   Updated Description: ${response.data.data.description}`);
      console.log(`   Updated Destination: ${response.data.data.destinationUrl}`);
    }
  } catch (error) {
    logTest('Update Endpoint', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 5: Get Endpoint with Secret
async function testGetEndpointWithSecret() {
  console.log(`\n${colors.cyan}TEST 5: Get Endpoint with Secret${colors.reset}`);
  try {
    const response = await axios.get(`${API_URL}/api/endpoints/${createdEndpointId}?includeSecret=true`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    const passed = response.status === 200 && response.data.data.secret;
    logTest('Get Endpoint with Secret', passed);
    
    if (passed) {
      console.log(`   Secret Retrieved: ${response.data.data.secret.substring(0, 20)}...`);
      console.log(`   ${colors.yellow}Note: Secret can be retrieved when needed${colors.reset}`);
    }
  } catch (error) {
    logTest('Get Endpoint with Secret', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 6: Quota Enforcement
async function testQuotaEnforcement() {
  console.log(`\n${colors.cyan}TEST 6: Quota Enforcement${colors.reset}`);
  console.log(`   ${colors.yellow}Attempting to create endpoints until quota is reached...${colors.reset}`);
  
  try {
    const endpointsToCreate = 5; // Free tier limit is 2
    let createdCount = 1; // We already have 1 from test 1
    let quotaExceeded = false;

    for (let i = 2; i <= endpointsToCreate; i++) {
      try {
        const response = await axios.post(
          `${API_URL}/api/endpoints`,
          {
            name: `Test Endpoint ${i}`,
            description: `Quota test endpoint ${i}`,
            destinationUrl: `https://webhook.site/test-${i}`,
          },
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );
        
        createdCount++;
        console.log(`   ${colors.green}✓ Created endpoint ${createdCount}${colors.reset}`);
      } catch (error) {
        if (error.response?.status === 403 && error.response?.data?.error?.code === 'QUOTA_EXCEEDED') {
          quotaExceeded = true;
          console.log(`   ${colors.yellow}✓ Quota limit reached at ${createdCount} endpoints${colors.reset}`);
          console.log(`   ${colors.yellow}Message: ${error.response.data.error.message}${colors.reset}`);
          break;
        } else {
          throw error;
        }
      }
    }

    logTest('Quota Enforcement', quotaExceeded);
  } catch (error) {
    logTest('Quota Enforcement', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 7: Regenerate Secret
async function testRegenerateSecret() {
  console.log(`\n${colors.cyan}TEST 7: Regenerate Endpoint Secret${colors.reset}`);
  try {
    const oldSecret = createdEndpointSecret;
    
    const response = await axios.post(
      `${API_URL}/api/endpoints/${createdEndpointId}/regenerate-secret`,
      {},
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    const passed = response.status === 200 && response.data.data.secret && response.data.data.secret !== oldSecret;
    logTest('Regenerate Secret', passed);
    
    if (passed) {
      console.log(`   Old Secret: ${oldSecret.substring(0, 20)}...`);
      console.log(`   New Secret: ${response.data.data.secret.substring(0, 20)}...`);
      console.log(`   ${colors.yellow}⚠️  ${response.data.message}${colors.reset}`);
      createdEndpointSecret = response.data.data.secret;
    }
  } catch (error) {
    logTest('Regenerate Secret', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 8: Get Endpoint Stats
async function testGetEndpointStats() {
  console.log(`\n${colors.cyan}TEST 8: Get Endpoint Statistics${colors.reset}`);
  try {
    const response = await axios.get(`${API_URL}/api/endpoints/${createdEndpointId}/stats`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    const passed = response.status === 200;
    logTest('Get Endpoint Stats', passed);
    
    if (passed) {
      console.log(`   Total Requests: ${response.data.data.totalRequests}`);
      console.log(`   Successful: ${response.data.data.successfulRequests}`);
      console.log(`   Failed: ${response.data.data.failedRequests}`);
      console.log(`   Success Rate: ${response.data.data.successRate}%`);
      console.log(`   Avg Response Time: ${response.data.data.averageResponseTime}ms`);
    }
  } catch (error) {
    logTest('Get Endpoint Stats', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 9: Test Endpoint
async function testEndpointTest() {
  console.log(`\n${colors.cyan}TEST 9: Test Endpoint${colors.reset}`);
  try {
    const response = await axios.post(
      `${API_URL}/api/endpoints/${createdEndpointId}/test`,
      {
        payload: {
          test: true,
          message: 'This is a test webhook',
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    const passed = response.status === 200;
    logTest('Test Endpoint', passed);
    
    if (passed) {
      console.log(`   Webhook URL: ${response.data.data.webhookUrl}`);
      console.log(`   ${colors.yellow}Instructions: ${response.data.data.instructions}${colors.reset}`);
    }
  } catch (error) {
    logTest('Test Endpoint', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 10: Delete Endpoint
async function testDeleteEndpoint() {
  console.log(`\n${colors.cyan}TEST 10: Delete Endpoint${colors.reset}`);
  try {
    const response = await axios.delete(`${API_URL}/api/endpoints/${createdEndpointId}`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    const passed = response.status === 200;
    logTest('Delete Endpoint', passed);
    
    if (passed) {
      console.log(`   Deleted Endpoint: ${response.data.data.name}`);
      console.log(`   Active: ${response.data.data.isActive}`);
    }
  } catch (error) {
    logTest('Delete Endpoint', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 11: List Endpoints with Inactive
async function testListEndpointsWithInactive() {
  console.log(`\n${colors.cyan}TEST 11: List All Endpoints (Including Inactive)${colors.reset}`);
  try {
    const response = await axios.get(`${API_URL}/api/endpoints?includeInactive=true`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    const passed = response.status === 200;
    logTest('List Endpoints with Inactive', passed);
    
    if (passed) {
      const activeEndpoints = response.data.data.endpoints.filter(e => e.isActive);
      const inactiveEndpoints = response.data.data.endpoints.filter(e => !e.isActive);
      console.log(`   Total Endpoints: ${response.data.data.endpoints.length}`);
      console.log(`   Active: ${activeEndpoints.length}`);
      console.log(`   Inactive: ${inactiveEndpoints.length}`);
    }
  } catch (error) {
    logTest('List Endpoints with Inactive', false, error.response?.data?.error?.message || error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log(`${colors.white}╔══════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.white}  RICHYTECH WEBHOOK RELAY - ENDPOINT MANAGEMENT TESTS${colors.reset}`);
  console.log(`${colors.white}╚══════════════════════════════════════════════════════╝${colors.reset}`);

  await loginUser();
  await testCreateEndpoint();
  await testListEndpoints();
  await testGetEndpoint();
  await testUpdateEndpoint();
  await testGetEndpointWithSecret();
  await testQuotaEnforcement();
  await testRegenerateSecret();
  await testGetEndpointStats();
  await testEndpointTest();
  await testDeleteEndpoint();
  await testListEndpointsWithInactive();

  // Summary
  console.log(`\n${colors.white}╔══════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.white}  TEST SUMMARY${colors.reset}`);
  console.log(`${colors.white}╚══════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`${colors.green}✅ Tests Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Tests Failed: ${testsFailed}${colors.reset}`);
  console.log(`${colors.cyan}Total Tests: ${testsPassed + testsFailed}${colors.reset}`);

  if (testsFailed === 0) {
    console.log(`\n${colors.green}🎉 All tests passed! Endpoint Management is working correctly.${colors.reset}`);
    console.log(`\n${colors.cyan}Next Step: Build Webhook Receiver to accept webhooks at these endpoints!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Some tests failed. Please check the errors above.${colors.reset}`);
  }
}

// Run tests
runAllTests().catch(console.error);
