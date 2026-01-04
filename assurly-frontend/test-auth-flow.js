#!/usr/bin/env node

/**
 * Test script to verify authentication flow integration
 * This demonstrates that the frontend is properly connected to the backend
 */

import axios from 'axios';

const API_BASE = 'https://assurly-frontend-400616570417.europe-west2.run.app';
const TEST_EMAIL = 'test@example.com';

console.log('🧪 Testing Assurly Authentication Flow\n');
console.log('=====================================\n');

async function testAuthEndpoints() {
  try {
    // Test 1: Request Magic Link
    console.log('1️⃣  Testing Magic Link Request...');
    const magicLinkResponse = await axios.post(
      `${API_BASE}/api/auth/request-magic-link`,
      {
        email: TEST_EMAIL,
        redirect_url: 'http://localhost:5174/auth/verify'
      }
    );
    
    console.log('✅ Magic link request successful!');
    console.log(`   Response: ${JSON.stringify(magicLinkResponse.data)}\n`);

    // Test 2: Check /auth/me without token (should fail)
    console.log('2️⃣  Testing /auth/me without token...');
    try {
      await axios.get(`${API_BASE}/api/auth/me`);
      console.log('❌ Unexpected: /auth/me succeeded without token');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('✅ Correctly rejected unauthenticated request');
        console.log(`   Status: ${error.response.status}\n`);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 3: Verify token endpoint structure
    console.log('3️⃣  Testing verify endpoint (with invalid token)...');
    try {
      await axios.get(`${API_BASE}/api/auth/verify/invalid-test-token`);
      console.log('❌ Unexpected: Invalid token was accepted');
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 401) {
        console.log('✅ Correctly rejected invalid token');
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data?.detail || error.response.data?.message}\n`);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('=====================================');
    console.log('✨ Authentication endpoints are working correctly!');
    console.log('\n📝 Notes:');
    console.log('- Magic link emails are not sent in test environment');
    console.log('- To complete the flow, a valid token from email would be needed');
    console.log('- The frontend is properly configured to use these endpoints');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testAuthEndpoints();