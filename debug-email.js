// debug-email.js - Test Email Service Directly
// Run this script to test email functionality: node debug-email.js

import dotenv from 'dotenv';
import { sendVerificationEmail } from './src/services/email-service.js';  // ← UPDATED PATH

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEmailService() {
  console.log('🧪 Testing Email Service Configuration\n');
  
  // Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
  console.log('');
  
  // Create a test user object
  const testUser = {
    _id: 'test-user-id',
    name: 'Test User',
    email: 'teja.sabinkar2304@gmail.com', // Use the working email
  };
  
  const testToken = 'test-verification-token-123456789';
  
  console.log('📧 Testing verification email sending...');
  console.log('Test User:', testUser);
  console.log('Test Token:', testToken);
  console.log('');
  
  try {
    const result = await sendVerificationEmail(testUser, testToken);
    console.log('✅ SUCCESS! Email sent successfully:');
    console.log('Message ID:', result.messageId);
    console.log('Accepted:', result.accepted);
    console.log('Rejected:', result.rejected);
    
    if (process.env.NODE_ENV !== 'production' && !process.env.EMAIL_HOST) {
      console.log('📧 Preview URL available for development');
    }
    
    console.log('');
    console.log('🎉 EMAIL SERVICE IS WORKING FROM src/services/!');
    console.log('Check the inbox for teja.sabinkar2304@gmail.com');
    console.log('');
    console.log('🚀 Ready for deployment! Next.js can now find @/services/email-service');
    
  } catch (error) {
    console.error('❌ FAILED! Email sending error:');
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Stack:', error.stack);
    
    // Specific troubleshooting based on error type
    if (error.message.includes('EAUTH')) {
      console.log('\n🔧 TROUBLESHOOTING: Authentication failed');
      console.log('- Check EMAIL_USER and EMAIL_PASSWORD are correct');
      console.log('- Make sure Gmail "App Password" is being used, not regular password');
      console.log('- Verify 2FA is enabled on Gmail account');
    }
    
    if (error.message.includes('ECONNECTION') || error.message.includes('ETIMEDOUT')) {
      console.log('\n🔧 TROUBLESHOOTING: Connection failed');
      console.log('- Check EMAIL_HOST and EMAIL_PORT settings');
      console.log('- Verify network connectivity');
      console.log('- Check firewall settings');
    }
    
    if (error.message.includes('NEXT_PUBLIC_APP_URL')) {
      console.log('\n🔧 TROUBLESHOOTING: Missing environment variable');
      console.log('- Add NEXT_PUBLIC_APP_URL to your .env.local file');
      console.log('- Value should be: http://localhost:3000 (development) or your production URL');
    }
    
    if (error.message.includes('Cannot resolve module')) {
      console.log('\n🔧 TROUBLESHOOTING: Module not found');
      console.log('- Make sure you moved: mv services src/services');
      console.log('- Check that src/services/email-service.js exists');
      console.log('- Verify the email service exports functions properly');
    }
  }
}

// Run the test
testEmailService()
  .then(() => {
    console.log('\n🏁 Email test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
  });