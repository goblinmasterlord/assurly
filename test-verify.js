#!/usr/bin/env node

import axios from 'axios';

// Get token from command line
const token = process.argv[2];

if (!token) {
  console.log('Usage: node test-verify.js <TOKEN>');
  console.log('Copy the token from your email (the part after ?token=)');
  process.exit(1);
}

async function testVerification() {
  console.log(`Testing token: ${token}\n`);
  
  try {
    // Test against the real backend
    const response = await axios.get(
      `https://assurly-frontend-400616570417.europe-west2.run.app/api/auth/verify/${token}`
    );
    
    console.log('✅ Verification successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check what fields are returned
    if (response.data.access_token) {
      console.log('\n✓ Access token received');
    }
    if (response.data.user) {
      console.log('✓ User data received:', response.data.user);
    }
    if (response.data.expires_in) {
      console.log('✓ Expires in:', response.data.expires_in, 'seconds');
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Verification failed');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testVerification();