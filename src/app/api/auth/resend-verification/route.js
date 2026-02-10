// File: src/app/api/auth/resend-verification/route.js

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { email } = await request.json();

    console.log('📧 Resend verification request for:', email);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({
      email: email.toLowerCase(),
      isEmailVerified: false
    });

    console.log('👤 User found:', user ? 'YES' : 'NO');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or already verified' },
        { status: 404 }
      );
    }

    // Generate new token
    const newToken = crypto.randomBytes(32).toString('hex');

    // Update MongoDB
    user.emailVerificationToken = newToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.emailVerificationAttempts = (user.emailVerificationAttempts || 0) + 1;
    user.lastVerificationEmailSent = new Date();

    await user.save();

    console.log('✅ MongoDB updated with new token');

    // Build verification link
    const verificationLink = `https://www.reggpt.uk/auth/verify-email?token=${newToken}&email=${email}`;

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"REG-GPT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your REG-GPT account - your free trial is waiting',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${user.name},</h2>
          <p>You requested a new verification link for your REG-GPT account.</p>
          <p>Your 3-month free trial is ready. Click below to verify and start getting instant Scottish Building Standards answers:</p>
          <a href="${verificationLink}" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Verify Email
          </a>
          <p>Or copy this link:<br>${verificationLink}</p>
          <p>This link expires in 24 hours.</p>
          <p>Best,<br>Teja<br>Founder, REG-GPT</p>
        </div>
      `
    });

    console.log('✅ Verification email sent to:', email);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('❌ Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}