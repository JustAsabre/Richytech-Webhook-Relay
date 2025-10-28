/**
 * API Key Management Tests
 * Tests all API key endpoints
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
let generatedKeyId = '';
let generatedKeyPlainText = '';

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
    console.log(`   ${colors.red}✗ Login failed: ${error.response?.data?.message || error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Test 1: Generate API Key
async function testGenerateKey() {
  console.log(`\n${colors.cyan}TEST 1: Generate API Key${colors.reset}`);
  try {
    const response = await axios.post(
      `${API_URL}/api/keys`,
      {
        name: 'Test API Key',
        description: 'API key for automated testing',
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    const passed = response.status === 201 && response.data.data.key;
    logTest('Generate API Key', passed);
    
    if (passed) {
      generatedKeyId = response.data.data.apiKey._id;
      generatedKeyPlainText = response.data.data.key;
      console.log(`   Key ID: ${generatedKeyId}`);
      console.log(`   Key: ${generatedKeyPlainText.substring(0, 20)}...`);
      console.log(`   Prefix: ${response.data.data.apiKey.prefix}`);
      console.log(`   ${colors.yellow}⚠️  ${response.data.message}${colors.reset}`);
    } else {
      console.log(`   ${colors.yellow}Response: ${JSON.stringify(response.data)}${colors.reset}`);
    }
  } catch (error) {
    console.log(`   ${colors.red}Error Details: ${JSON.stringify(error.response?.data)}${colors.reset}`);
    logTest('Generate API Key', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 2: List API Keys
async function testListKeys() {
  console.log(`\n${colors.cyan}TEST 2: List API Keys${colors.reset}`);
  try {
    const response = await axios.get(`${API_URL}/api/keys`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    const passed = response.status === 200 && Array.isArray(response.data.data.apiKeys);
    logTest('List API Keys', passed);
    
    if (passed) {
      console.log(`   Found ${response.data.data.apiKeys.length} API key(s)`);
      console.log(`   Quota: ${response.data.data.quota.used}/${response.data.data.quota.limit}`);
      response.data.data.apiKeys.forEach((key, index) => {
        console.log(`   ${index + 1}. ${key.name} (${key.prefix}...)`);
      });
    }
  } catch (error) {
    logTest('List API Keys', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 3: Get Single API Key
async function testGetKey() {
  console.log(`\n${colors.cyan}TEST 3: Get Single API Key${colors.reset}`);
  try {
    const response = await axios.get(`${API_URL}/api/keys/${generatedKeyId}`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    const passed = response.status === 200 && response.data.data._id === generatedKeyId;
    logTest('Get Single API Key', passed);
    
    if (passed) {
      console.log(`   Name: ${response.data.data.name}`);
      console.log(`   Description: ${response.data.data.description}`);
      console.log(`   Active: ${response.data.data.isActive}`);
      console.log(`   Created: ${new Date(response.data.data.createdAt).toLocaleString()}`);
    }
  } catch (error) {
    logTest('Get Single API Key', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 4: Update API Key
async function testUpdateKey() {
  console.log(`\n${colors.cyan}TEST 4: Update API Key${colors.reset}`);
  try {
    const response = await axios.put(
      `${API_URL}/api/keys/${generatedKeyId}`,
      {
        name: 'Updated Test API Key',
        description: 'Updated description for testing',
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    const passed = response.status === 200;
    logTest('Update API Key', passed);
    
    if (passed) {
      console.log(`   Updated Name: ${response.data.data.name}`);
      console.log(`   Updated Description: ${response.data.data.description}`);
    }
  } catch (error) {
    logTest('Update API Key', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 5: Validate API Key (using validateApiKey middleware)
async function testValidateKey() {
  console.log(`\n${colors.cyan}TEST 5: Validate API Key (Webhook Endpoint Simulation)${colors.reset}`);
  console.log(`   ${colors.yellow}Note: This will be tested when webhook endpoints are created${colors.reset}`);
  console.log(`   ${colors.yellow}For now, we'll just verify the key format${colors.reset}`);
  
  const isValidFormat = generatedKeyPlainText.startsWith('rty_test_') || generatedKeyPlainText.startsWith('rty_live_');
  logTest('Validate API Key Format', isValidFormat);
  
  if (isValidFormat) {
    console.log(`   Key Format: ${generatedKeyPlainText.split('_')[1]} mode`);
    console.log(`   Prefix: ${generatedKeyPlainText.substring(0, 12)}...`);
  }
}

// Test 6: Quota Enforcement (try to exceed limit)
async function testQuotaEnforcement() {
  console.log(`\n${colors.cyan}TEST 6: Quota Enforcement${colors.reset}`);
  console.log(`   ${colors.yellow}Attempting to generate keys until quota is reached...${colors.reset}`);
  
  try {
    const keysToGenerate = 5; // Free tier limit is 2
    let generatedCount = 1; // We already have 1 from test 1
    let quotaExceeded = false;

    for (let i = 2; i <= keysToGenerate; i++) {
      try {
        const response = await axios.post(
          `${API_URL}/api/keys`,
          {
            name: `Test Key ${i}`,
            description: `Quota test key ${i}`,
          },
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );
        
        generatedCount++;
        console.log(`   ${colors.green}✓ Generated key ${generatedCount}${colors.reset}`);
      } catch (error) {
        if (error.response?.status === 403 && error.response?.data?.error?.code === 'QUOTA_EXCEEDED') {
          quotaExceeded = true;
          console.log(`   ${colors.yellow}✓ Quota limit reached at ${generatedCount} keys${colors.reset}`);
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

// Test 7: Rotate API Key
async function testRotateKey() {
  console.log(`\n${colors.cyan}TEST 7: Rotate API Key${colors.reset}`);
  try {
    const response = await axios.post(
      `${API_URL}/api/keys/${generatedKeyId}/rotate`,
      {},
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    const passed = response.status === 201 && response.data.data.key;
    logTest('Rotate API Key', passed);
    
    if (passed) {
      console.log(`   New Key ID: ${response.data.data.apiKey._id}`);
      console.log(`   New Key: ${response.data.data.key.substring(0, 20)}...`);
      console.log(`   Revoked Key ID: ${response.data.data.revokedKey._id}`);
      console.log(`   ${colors.yellow}⚠️  ${response.data.message}${colors.reset}`);
      
      // Update for revoke test
      generatedKeyId = response.data.data.apiKey._id;
    }
  } catch (error) {
    logTest('Rotate API Key', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 8: Revoke API Key
async function testRevokeKey() {
  console.log(`\n${colors.cyan}TEST 8: Revoke API Key${colors.reset}`);
  try {
    const response = await axios.delete(`${API_URL}/api/keys/${generatedKeyId}`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    const passed = response.status === 200;
    logTest('Revoke API Key', passed);
    
    if (passed) {
      console.log(`   Revoked Key: ${response.data.data.name}`);
      console.log(`   Active: ${response.data.data.isActive}`);
    }
  } catch (error) {
    logTest('Revoke API Key', false, error.response?.data?.error?.message || error.message);
  }
}

// Test 9: List Keys with Inactive
async function testListKeysWithInactive() {
  console.log(`\n${colors.cyan}TEST 9: List All Keys (Including Inactive)${colors.reset}`);
  try {
    const response = await axios.get(`${API_URL}/api/keys?includeInactive=true`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    const passed = response.status === 200;
    logTest('List Keys with Inactive', passed);
    
    if (passed) {
      const activeKeys = response.data.data.apiKeys.filter(k => k.isActive);
      const inactiveKeys = response.data.data.apiKeys.filter(k => !k.isActive);
      console.log(`   Total Keys: ${response.data.data.apiKeys.length}`);
      console.log(`   Active: ${activeKeys.length}`);
      console.log(`   Inactive: ${inactiveKeys.length}`);
    }
  } catch (error) {
    logTest('List Keys with Inactive', false, error.response?.data?.error?.message || error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log(`${colors.white}╔════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.white}  RICHYTECH WEBHOOK RELAY - API KEY MANAGEMENT TESTS${colors.reset}`);
  console.log(`${colors.white}╚════════════════════════════════════════════════════╝${colors.reset}`);

  await loginUser();
  await testGenerateKey();
  await testListKeys();
  await testGetKey();
  await testUpdateKey();
  await testValidateKey();
  await testQuotaEnforcement();
  await testRotateKey();
  await testRevokeKey();
  await testListKeysWithInactive();

  // Summary
  console.log(`\n${colors.white}╔════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.white}  TEST SUMMARY${colors.reset}`);
  console.log(`${colors.white}╚════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`${colors.green}✅ Tests Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Tests Failed: ${testsFailed}${colors.reset}`);
  console.log(`${colors.cyan}Total Tests: ${testsPassed + testsFailed}${colors.reset}`);

  if (testsFailed === 0) {
    console.log(`\n${colors.green}🎉 All tests passed! API Key Management is working correctly.${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Some tests failed. Please check the errors above.${colors.reset}`);
  }
}

// Run tests
runAllTests().catch(console.error);
