// test-signup-api.js - Test the actual signup API endpoint
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const testSignup = async () => {
  try {
    console.log('🧪 Testing actual signup API endpoint...');
    
    const signupData = {
      name: 'Test User Different Email',
      email: 'test.different.email@gmail.com', // Try a different Gmail or other provider
      password: 'TestPassword123!'
    };
    
    console.log('📡 Making signup request to: http://localhost:3000/api/auth/signup');
    console.log('📝 Request data:', {
      name: signupData.name,
      email: signupData.email,
      hasPassword: !!signupData.password
    });
    
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData)
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Signup successful!');
      console.log('📧 Email status:', data.emailSent ? 'SENT' : 'FAILED');
      console.log('📋 Full response:', JSON.stringify(data, null, 2));
      
      if (!data.emailSent) {
        console.log('❌ Email sending failed!');
        console.log('📧 Email error:', data.emailError);
        console.log('⚠️ Email warning:', data.emailWarning);
      }
    } else {
      console.log('❌ Signup failed!');
      console.log('📋 Error response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('🔥 Request failed:', error.message);
    console.error('Stack:', error.stack);
  }
};

// Make sure your Next.js server is running on localhost:3000
console.log('⚠️ Make sure your Next.js server is running: npm run dev');
console.log('🎯 Testing signup API...\n');

testSignup();