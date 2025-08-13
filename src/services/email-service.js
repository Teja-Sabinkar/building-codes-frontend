// services/email-service.js - Enhanced with Better Attachment Support
import nodemailer from 'nodemailer';

/**
 * Send an email using nodemailer with enhanced attachment support
 */
export async function sendEmail({ to, subject, html, attachments }) {
  let transporter;
  
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
    });
  } else {
    // For development, use ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Prepare mail options
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"REG-GPT" <noreply@reg-gpt.com>',
    to,
    subject,
    html,
  };

  // Add attachments if provided
  if (attachments && attachments.length > 0) {
    // Process attachments to ensure proper format
    mailOptions.attachments = attachments.map(attachment => {
      // Ensure attachment has proper structure
      const processedAttachment = {
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType || 'application/octet-stream',
      };

      // Add Content-ID for inline images
      if (attachment.cid) {
        processedAttachment.cid = attachment.cid;
      }

      // Set encoding if specified
      if (attachment.encoding) {
        processedAttachment.encoding = attachment.encoding;
      }

      console.log(`📎 Processing attachment: ${attachment.filename} (${attachment.contentType})`);
      
      return processedAttachment;
    });

    console.log(`📧 Email will include ${attachments.length} attachment(s)`);
  }

  try {
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
      attachmentCount: attachments ? attachments.length : 0
    });

    return info;

  } catch (error) {
    console.error('❌ Error sending email:', error);
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
export async function sendVerificationEmail(user, verificationToken) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify Your Email Address</h2>
      <p>Hi ${user.name},</p>
      <p>Thank you for signing up for REG-GPT. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
      </div>
      <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't sign up for REG-GPT, please ignore this email.</p>
      <p>Best regards,<br>The REG-GPT Team</p>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email Address - REG-GPT',
    html,
  });
}

/**
 * Send a password reset email to the user
 */
export async function sendPasswordResetEmail(user, resetToken) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>Hi ${user.name},</p>
      <p>You are receiving this email because you (or someone else) has requested to reset your password for your REG-GPT account.</p>
      <p>Please click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
      <p>Best regards,<br>The REG-GPT Team</p>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject: 'Reset Your Password - REG-GPT',
    html,
  });
}