// app/api/auth/login/route.js - FIXED: Corrected Soft Deletion Check
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Parse the request body
    const { email, password } = await request.json();
    
    // Check if email and password are provided
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please provide email and password' },
        { status: 400 }
      );
    }
    
    // 🔧 FIXED: Find user without middleware filter, then check deletion manually
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // 🆕 CHECK IF ACCOUNT IS DELETED
    if (user.isDeleted === true) {
      console.log('🚫 Login attempt on deleted account:', {
        userId: user._id,
        email: user.originalEmail || email,
        deletedAt: user.deletedAt,
        attemptTime: new Date().toISOString()
      });

      return NextResponse.json(
        { 
          error: 'Account not found',
          code: 'ACCOUNT_DELETED',
          message: 'This account has been deactivated. Please contact support if you believe this is an error.'
        },
        { status: 401 }
      );
    }
    
    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Check if email is verified
    if (!user.isEmailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email before logging in' },
        { status: 401 }
      );
    }
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Successful login:', {
      userId: user._id,
      email: user.email,
      lastLogin: user.lastLogin
    });
    
    // Return success response WITH token
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}