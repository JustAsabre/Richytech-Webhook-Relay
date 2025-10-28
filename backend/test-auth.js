/**
 * Authentication Tests - Node.js Version
 * Tests all authentication endpoints without interfering with the running server
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  white: '\x1b[37m'
};

let userToken = '';
let adminToken = '';
let testsPassed = 0;
let testsFailed = 0;

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

// Test 1: Health Check
async function testHealthCheck() {
  console.log(`\n${colors.cyan}TEST 1: Health Check${colors.reset}`);
  try {
    const response = await axios.get(`${API_URL}/health`);
    logTest('Health Check', response.status === 200 && response.data.success === true);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
  } catch (error) {
    logTest('Health Check', false, error.message);
  }
}

// Test 2: Register New User
async function testRegister() {
  console.log(`\n${colors.cyan}TEST 2: User Registration${colors.reset}`);
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'Test@123456',
      businessName: 'Test Business'
    });
    
    logTest('User Registration', response.status === 201);
    console.log(`   User ID: ${response.data.data.user._id}`);
    console.log(`   Email: ${response.data.data.user.email}`);
    console.log(`   Tier: ${response.data.data.user.subscriptionTier}`);
    userToken = response.data.token; // Token is at root level, not in data.token
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.log(`   ${colors.red}Error: ${errorMsg}${colors.reset}`);
    if (error.response?.data) {
      console.log(`   ${colors.yellow}Response data: ${JSON.stringify(error.response.data)}${colors.reset}`);
    }
    
    // User already exists (409) or email already registered (400)
    if (error.response && (error.response.status === 409 || (error.response.status === 400 && errorMsg?.includes('Email already registered')))) {
      console.log(`   ${colors.yellow}Note: User already exists - trying to login instead${colors.reset}`);
      // Try logging in instead
      try {
        const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
          email: 'test@example.com',
          password: 'Test@123456'
        });
        userToken = loginResponse.data.token; // Token is at root level
        logTest('User Registration (via login)', true);
        console.log(`   Logged in existing user successfully`);
        if (userToken) {
          console.log(`   Token: ${userToken.substring(0, 20)}...`);
        }
      } catch (loginError) {
        logTest('User Registration', false, loginError.response?.data?.message || loginError.message);
      }
    } else {
      logTest('User Registration', false, errorMsg);
    }
  }
}

// Test 3: User Login
async function testLogin() {
  console.log(`\n${colors.cyan}TEST 3: User Login${colors.reset}`);
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'Test@123456'
    });
    
    logTest('User Login', response.status === 200);
    if (response.data && response.data.token) {
      console.log(`   Token received: ${response.data.token.substring(0, 20)}...`);
      userToken = response.data.token; // Token is at root level
    }
  } catch (error) {
    logTest('User Login', false, error.response?.data?.message || error.message);
  }
}

// Test 4: Get Current User (Protected Route)
async function testGetMe() {
  console.log(`\n${colors.cyan}TEST 4: Get Current User (Protected Route)${colors.reset}`);
  try {
    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    });
    
    logTest('Get Current User', response.status === 200);
    if (response.data.data) {
      console.log(`   User: ${response.data.data.fullName || 'N/A'}`);
      console.log(`   Email: ${response.data.data.email || 'N/A'}`);
      console.log(`   Subscription: ${response.data.data.subscriptionTier || 'N/A'}`);
    }
  } catch (error) {
    logTest('Get Current User', false, error.response?.data?.message || error.message);
    console.log(`   ${colors.yellow}Token used: ${userToken ? userToken.substring(0, 20) + '...' : 'None'}${colors.reset}`);
  }
}

// Test 5: Update Profile
async function testUpdateProfile() {
  console.log(`\n${colors.cyan}TEST 5: Update Profile${colors.reset}`);
  try {
    const response = await axios.put(`${API_URL}/api/auth/me`, 
      {
        fullName: 'Updated Test User',
        businessName: 'Updated Business Ltd'
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      }
    );
    
    logTest('Update Profile', response.status === 200);
    if (response.data.data) {
      console.log(`   Updated Name: ${response.data.data.fullName || 'N/A'}`);
      console.log(`   Updated Business: ${response.data.data.businessName || 'N/A'}`);
    }
  } catch (error) {
    logTest('Update Profile', false, error.response?.data?.message || error.message);
  }
}

// Test 6: Admin Login
async function testAdminLogin() {
  console.log(`\n${colors.cyan}TEST 6: Admin Login${colors.reset}`);
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@richytech.inc',
      password: 'Admin@123456'
    });
    
    logTest('Admin Login', response.status === 200);
    if (response.data && response.data.token) {
      console.log(`   Admin Token received: ${response.data.token.substring(0, 20)}...`);
      adminToken = response.data.token; // Token is at root level
    }
    if (response.data.data && response.data.data.user) {
      console.log(`   Role: ${response.data.data.user.role}`);
    }
  } catch (error) {
    logTest('Admin Login', false, error.response?.data?.message || error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log(`${colors.white}╔══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.white}  RICHYTECH WEBHOOK RELAY - AUTHENTICATION TESTS${colors.reset}`);
  console.log(`${colors.white}╚══════════════════════════════════════════════════╝${colors.reset}`);

  await testHealthCheck();
  await testRegister();
  await testLogin();
  await testGetMe();
  await testUpdateProfile();
  
  // Wait 1 second to avoid rate limiting before admin login
  console.log(`\n${colors.yellow}⏳ Waiting 1 second to avoid rate limiting...${colors.reset}`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testAdminLogin();

  // Summary
  console.log(`\n${colors.white}╔══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.white}  TEST SUMMARY${colors.reset}`);
  console.log(`${colors.white}╚══════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`${colors.green}✅ Tests Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Tests Failed: ${testsFailed}${colors.reset}`);
  console.log(`${colors.cyan}Total Tests: ${testsPassed + testsFailed}${colors.reset}`);

  if (testsFailed === 0) {
    console.log(`\n${colors.green}🎉 All tests passed! Authentication system is working correctly.${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Some tests failed. Please check the errors above.${colors.reset}`);
  }

  // Save tokens for manual testing
  if (userToken) {
    console.log(`\n${colors.cyan}User Token (for manual testing):${colors.reset}`);
    console.log(userToken);
  }
  if (adminToken) {
    console.log(`\n${colors.cyan}Admin Token (for manual testing):${colors.reset}`);
    console.log(adminToken);
  }
}

// Run tests
runAllTests().catch(console.error);
