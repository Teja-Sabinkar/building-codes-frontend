// services/email-service.js
import nodemailer from 'nodemailer';

/**
 * Send an email using nodemailer
 * For production, you would use a service like SendGrid, Mailgun, etc.
 * This is a simple implementation for development purposes
 */
export async function sendEmail({ to, subject, html }) {
  // For development, use a test account from ethereal.email
  // In production, replace this with your actual email service credentials
  let testAccount;
  let transporter;
  
  if (process.env.EMAIL_HOST) {
    // Configure production email service here
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // For development, use ethereal.email
    testAccount = await nodemailer.createTestAccount();
    
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

  // Send the email
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"AI CAD" <noreply@aicad.com>',
    to,
    subject,
    html,
  });

  // For development, log the ethereal.email URL where the email can be viewed
  if (process.env.NODE_ENV !== 'production' && testAccount) {
    console.log('Email preview URL: %s', nodemailer.getTestMessageUrl(info));
  }

  return info;
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
      <p>Thank you for signing up for AI CAD. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
      </div>
      <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't sign up for AI CAD, please ignore this email.</p>
      <p>Best regards,<br>The AI CAD Team</p>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email Address',
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
      <p>You are receiving this email because you (or someone else) has requested to reset your password for your AI CAD account.</p>
      <p>Please click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
      <p>Best regards,<br>The AI CAD Team</p>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject: 'Reset Your Password',
    html,
  });
}