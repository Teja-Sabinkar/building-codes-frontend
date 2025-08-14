// services/email-service.js - CommonJS VERSION (Fixed for deployment)
const nodemailer = require('nodemailer');

/**
 * Send an email using nodemailer with enhanced attachment support
 */
async function sendEmail({ to, subject, html, attachments }) {
  let transporter;
  
  console.log('📧 Email service configuration check:', {
    hasEmailHost: !!process.env.EMAIL_HOST,
    emailHost: process.env.EMAIL_HOST,
    emailPort: process.env.EMAIL_PORT,
    emailUser: process.env.EMAIL_USER,
    hasPassword: !!process.env.EMAIL_PASSWORD,
    emailFrom: process.env.EMAIL_FROM,
    nodeEnv: process.env.NODE_ENV
  });
  
  if (process.env.EMAIL_HOST) {
    // Production email service configuration
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      // Enhanced configuration for attachments
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 20000,
      rateLimit: 5,
      // Add debugging for connection issues
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development'
    });
  } else {
    console.log('⚠️ No EMAIL_HOST found, using ethereal.email for testing');
    
    // For development, use ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Verify SMTP connection
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
  } catch (error) {
    console.error('❌ SMTP connection verification failed:', error);
    throw new Error(`SMTP connection failed: ${error.message}`);
  }

  // Prepare mail options
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"REG-GPT" <sabinkar2304@gmail.com>',
    to,
    subject,
    html,
  };

  console.log('📮 Preparing email:', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject,
    hasHtml: !!mailOptions.html,
    htmlLength: mailOptions.html ? mailOptions.html.length : 0
  });

  // Add attachments if provided
  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments.map(attachment => {
      const processedAttachment = {
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType || 'application/octet-stream',
      };

      if (attachment.cid) {
        processedAttachment.cid = attachment.cid;
      }

      if (attachment.encoding) {
        processedAttachment.encoding = attachment.encoding;
      }

      console.log(`📎 Processing attachment: ${attachment.filename} (${attachment.contentType})`);
      
      return processedAttachment;
    });

    console.log(`📧 Email will include ${attachments.length} attachment(s)`);
  }

  try {
    console.log('🚀 Sending email...');
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);

    // For development, log the ethereal.email URL where the email can be viewed
    if (process.env.NODE_ENV !== 'production' && !process.env.EMAIL_HOST) {
      console.log('📧 Email preview URL: %s', nodemailer.getTestMessageUrl(info));
      console.log('📧 Check your ethereal.email inbox to see attachments');
    }

    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to: to,
      subject: subject,
      attachmentCount: attachments ? attachments.length : 0,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response
    });

    return info;

  } catch (error) {
    console.error('❌ Error sending email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      to: to,
      subject: subject
    });
    throw error;
  } finally {
    // Close the transporter
    if (transporter && typeof transporter.close === 'function') {
      transporter.close();
    }
  }
}

/**
 * Send a verification email to the user
 */
async function sendVerificationEmail(user, verificationToken) {
  console.log('🔗 Generating verification email for user:', {
    userId: user._id,
    userEmail: user.email,
    userName: user.name,
    hasToken: !!verificationToken,
    tokenLength: verificationToken ? verificationToken.length : 0
  });

  // Check if required environment variables are set
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error('❌ NEXT_PUBLIC_APP_URL environment variable is not set!');
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is required for verification emails');
  }

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}`;
  
  console.log('🔗 Generated verification URL:', verificationUrl);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin: 0; font-size: 28px;">REG-GPT</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Building Codes Assistant</p>
        </div>
        
        <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
        <p style="color: #555; line-height: 1.6;">Hi ${user.name},</p>
        <p style="color: #555; line-height: 1.6;">Thank you for signing up for REG-GPT. Please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Verify Email Address</a>
        </div>
        
        <p style="color: #666; line-height: 1.6; font-size: 14px;">If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="color: #059669; word-break: break-all; font-size: 14px;">${verificationUrl}</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px; margin-bottom: 5px;">⏰ This link will expire in 24 hours.</p>
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">🔒 If you didn't sign up for REG-GPT, please ignore this email.</p>
          
          <p style="color: #333; margin-bottom: 5px;">Best regards,</p>
          <p style="color: #059669; font-weight: bold; margin: 0;">The REG-GPT Team</p>
        </div>
      </div>
    </div>
  `;
  
  console.log('📧 Sending verification email to:', user.email);
  
  try {
    const result = await sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address - REG-GPT',
      html,
    });
    
    console.log('✅ Verification email sent successfully:', {
      userId: user._id,
      userEmail: user.email,
      messageId: result.messageId
    });
    
    return result;
  } catch (error) {
    console.error('❌ Failed to send verification email:', {
      userId: user._id,
      userEmail: user.email,
      error: error.message
    });
    throw error;
  }
}

/**
 * Send a password reset email to the user
 */
async function sendPasswordResetEmail(user, resetToken) {
  console.log('🔑 Generating password reset email for user:', {
    userId: user._id,
    userEmail: user.email,
    userName: user.name
  });

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error('❌ NEXT_PUBLIC_APP_URL environment variable is not set!');
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is required for password reset emails');
  }

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
  
  console.log('🔗 Generated reset URL:', resetUrl);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin: 0; font-size: 28px;">REG-GPT</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Building Codes Assistant</p>
        </div>
        
        <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
        <p style="color: #555; line-height: 1.6;">Hi ${user.name},</p>
        <p style="color: #555; line-height: 1.6;">You are receiving this email because you (or someone else) has requested to reset your password for your REG-GPT account.</p>
        <p style="color: #555; line-height: 1.6;">Please click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Reset Password</a>
        </div>
        
        <p style="color: #666; line-height: 1.6; font-size: 14px;">If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="color: #059669; word-break: break-all; font-size: 14px;">${resetUrl}</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #dc2626; font-size: 14px; margin-bottom: 5px;">⏰ This link will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">🔒 If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          
          <p style="color: #333; margin-bottom: 5px;">Best regards,</p>
          <p style="color: #059669; font-weight: bold; margin: 0;">The REG-GPT Team</p>
        </div>
      </div>
    </div>
  `;
  
  try {
    const result = await sendEmail({
      to: user.email,
      subject: 'Reset Your Password - REG-GPT',
      html,
    });
    
    console.log('✅ Password reset email sent successfully:', {
      userId: user._id,
      userEmail: user.email,
      messageId: result.messageId
    });
    
    return result;
  } catch (error) {
    console.error('❌ Failed to send password reset email:', {
      userId: user._id,
      userEmail: user.email,
      error: error.message
    });
    throw error;
  }
}

// CommonJS exports
module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
};