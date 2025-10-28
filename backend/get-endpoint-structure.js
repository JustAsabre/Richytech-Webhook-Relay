const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let authToken = '';

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'Test@123456'
    });
    authToken = response.data.token;  // Token is at root level
    console.log('✅ Logged in successfully');
    return true;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function createEndpoint() {
  try {
    console.log(`\n🔑 Using token: ${authToken.substring(0, 20)}...`);
    
    const response = await axios.get(`${BASE_URL}/api/endpoints`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('\n📋 ENDPOINT STRUCTURE:');
    const ep = response.data.data.endpoints[0];
    if (ep) {
      console.log(JSON.stringify(ep, null, 2));
      
      console.log('\n🔍 KEY FIELDS:');
      console.log(`  _id: ${ep._id}`);
      console.log(`  user (if populated): ${ep.user?._id || 'not populated'}`);
      console.log(`  user (raw): ${ep.user}`);
    } else {
      console.log('No endpoints found - let me create one');
      const create = await axios.post(`${BASE_URL}/api/endpoints`, {
        name: 'Test Endpoint',
        description: 'Test endpoint',
        destinationUrl: 'https://webhook.site/test',
        customHeaders: {}
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log(JSON.stringify(create.data.data.endpoint, null, 2));
    }
    
    return ep;
  } catch (error) {
    console.log('❌ Create endpoint failed:', error.response?.data || error.message);
    return null;
  }
}

(async () => {
  const success = await login();
  if (success) {
    await createEndpoint();
  }
})();
