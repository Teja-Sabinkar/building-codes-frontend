// app/api/auth/reset-password/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Parse the request body
    const { token, password } = await request.json();
    
    // Check if token and password are provided
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }
    
    // Check if password meets minimum length requirement
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
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
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    // Check if user exists with valid token
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }
    
    // Update user's password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Save the user
    await user.save();
    
    // Return success response
    return NextResponse.json({
      message: 'Password reset successful. You can now log in with your new password.'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred while resetting your password' },
      { status: 500 }
    );
  }
}