// simple-test.js - Quick file existence and content check
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('🔍 Checking email service file...\n');

const emailServicePath = resolve(process.cwd(), 'services/email-service.js');
console.log('📁 Looking for file at:', emailServicePath);

// Check if file exists
if (existsSync(emailServicePath)) {
  console.log('✅ File exists');
  
  try {
    // Read file content
    const content = readFileSync(emailServicePath, 'utf8');
    console.log('📄 File size:', content.length, 'characters');
    
    if (content.length === 0) {
      console.log('❌ File is empty!');
      console.log('📝 You need to add the email service code to this file');
    } else if (content.length < 100) {
      console.log('⚠️ File is very small, might be incomplete');
      console.log('Content preview:', content.substring(0, 200));
    } else {
      console.log('✅ File has content');
      
      // Check for key exports
      if (content.includes('export') && content.includes('sendVerificationEmail')) {
        console.log('✅ File appears to have the sendVerificationEmail export');
        
        // Try to import it
        try {
          const { sendVerificationEmail } = await import('./services/email-service.js');
          console.log('✅ Email service imported successfully!');
          console.log('📧 sendVerificationEmail function:', typeof sendVerificationEmail);
        } catch (importError) {
          console.log('❌ Import failed:', importError.message);
          console.log('📝 There might be a syntax error in the file');
        }
        
      } else {
        console.log('❌ File missing required exports');
        console.log('📝 File should export sendVerificationEmail function');
      }
    }
  } catch (error) {
    console.log('❌ Error reading file:', error.message);
  }
  
} else {
  console.log('❌ File does not exist');
  console.log('📝 Create the file: touch services/email-service.js');
}

console.log('\n🔍 Checking other files...');
console.log('✅ .env.local:', existsSync('.env.local'));
console.log('✅ package.json:', existsSync('package.json'));
console.log('✅ services directory:', existsSync('services'));