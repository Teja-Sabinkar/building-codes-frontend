// app/api/auth/verify-email/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    console.log('🔍 Starting email verification process...');
    
    await connectToDatabase();
    console.log('✅ Database connected successfully');
    
    const { token } = await request.json();
    
    console.log('🔍 Verification request data:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    });
    
    if (!token) {
      console.log('❌ No verification token provided');
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }
    
    // DON'T hash - the token in database is already the final token
    console.log('🔍 Searching for user with verification token...');
    const user = await User.findOne({
      emailVerificationToken: token,  // Direct comparison, no hashing
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      console.log('❌ No user found with valid verification token');
      
      const expiredUser = await User.findOne({
        emailVerificationToken: token
      });
      
      if (expiredUser) {
        console.log('⏰ Found user but token has expired');
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
      email: user.email
    });
    
    if (user.isEmailVerified) {
      console.log('ℹ️ User email is already verified');
      return NextResponse.json({
        message: 'Email is already verified. You can now log in.'
      });
    }
    
    console.log('✅ Updating user verification status...');
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    
    await user.save({ validateBeforeSave: false });
    
    console.log('✅ User verification completed successfully');
    
    return NextResponse.json({
      message: 'Email verified successfully! You can now log in with full access to REG-GPT.'
    });
    
  } catch (error) {
    console.error('❌ Email verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred during email verification' },
      { status: 500 }
    );
  }
}