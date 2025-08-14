// app/api/auth/verify-email/route.js - ENHANCED with Better Logging
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    console.log('🔍 Starting email verification process...');
    
    // Connect to the database
    await connectToDatabase();
    console.log('✅ Database connected successfully');
    
    // Parse the request body
    const { token } = await request.json();
    
    console.log('📝 Verification request data:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    });
    
    // Check if token is provided
    if (!token) {
      console.log('❌ No verification token provided');
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }
    
    // Hash the token to compare with the stored token
    console.log('🔑 Hashing provided token for comparison...');
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    console.log('✅ Token hashed successfully');
    
    // Find the user with the token
    console.log('🔍 Searching for user with verification token...');
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    // Check if user exists with valid token
    if (!user) {
      console.log('❌ No user found with valid verification token:', {
        hashedTokenStart: hashedToken.substring(0, 10) + '...',
        currentTime: new Date().toISOString()
      });
      
      // Check if there's a user with this token but expired
      const expiredUser = await User.findOne({
        emailVerificationToken: hashedToken
      });
      
      if (expiredUser) {
        console.log('⏰ Found user but token has expired:', {
          userId: expiredUser._id,
          email: expiredUser.email,
          tokenExpired: expiredUser.emailVerificationExpires,
          currentTime: new Date()
        });
        
        return NextResponse.json(
          { error: 'Verification token has expired. Please request a new verification email.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }
    
    console.log('✅ User found for verification:', {
      userId: user._id,
      email: user.email,
      name: user.name,
      currentlyVerified: user.isEmailVerified,
      tokenExpires: user.emailVerificationExpires
    });
    
    // Check if user is already verified
    if (user.isEmailVerified) {
      console.log('ℹ️ User email is already verified');
      return NextResponse.json({
        message: 'Email is already verified. You can now log in.'
      });
    }
    
    // Update user to verified status
    console.log('✅ Updating user verification status...');
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    
    // Save the user
    const savedUser = await user.save({ validateBeforeSave: false });
    
    console.log('✅ User verification completed successfully:', {
      userId: savedUser._id,
      email: savedUser.email,
      isEmailVerified: savedUser.isEmailVerified,
      verifiedAt: new Date().toISOString()
    });
    
    // Return success response
    return NextResponse.json({
      message: 'Email verified successfully! You can now log in with full access to REG-GPT.'
    });
    
  } catch (error) {
    console.error('❌ Email verification error:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { error: 'An error occurred during email verification' },
      { status: 500 }
    );
  }
}