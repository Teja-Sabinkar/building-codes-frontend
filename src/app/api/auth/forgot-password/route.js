// app/api/auth/forgot-password/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/services/email-service';

export async function POST(request) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Parse the request body
    const { email } = await request.json();
    
    // Check if email is provided
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Find the user by email
    const user = await User.findOne({ email });
    
    // If no user found, still return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        message: 'If your email is registered with us, you will receive a password reset link shortly'
      });
    }
    
    // Generate password reset token
    const resetToken = user.createPasswordResetToken();
    
    // Save the user without validation
    await user.save({ validateBeforeSave: false });
    
    // Send password reset email
    await sendPasswordResetEmail(user, resetToken);
    
    // Return success response
    return NextResponse.json({
      message: 'If your email is registered with us, you will receive a password reset link shortly'
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}