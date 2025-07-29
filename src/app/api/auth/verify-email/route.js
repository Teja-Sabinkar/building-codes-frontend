// app/api/auth/verify-email/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Parse the request body
    const { token } = await request.json();
    
    // Check if token is provided
    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }
    
    // Hash the token to compare with the stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find the user with the token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    // Check if user exists with valid token
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }
    
    // Update user to verified status
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    
    // Save the user
    await user.save({ validateBeforeSave: false });
    
    // Return success response
    return NextResponse.json({
      message: 'Email verified successfully! You can now log in.'
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred during email verification' },
      { status: 500 }
    );
  }
}