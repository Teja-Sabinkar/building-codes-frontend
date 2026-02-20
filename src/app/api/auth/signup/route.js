// app/api/auth/signup/route.js - FIXED: Token storage consistency
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import { sendVerificationEmail } from '@/services/email-service';

export async function POST(request) {
  try {
    console.log('🚀 Starting user signup process...');
    
    await connectToDatabase();
    console.log('✅ Database connected successfully');
    
    const { name, email, password } = await request.json();
    
    console.log('📝 Signup request data:', {
      name: name,
      email: email,
      hasPassword: !!password,
      passwordLength: password ? password.length : 0
    });
    
    if (!name || !email || !password) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      );
    }
    
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }
    
    if (password.length < 8) {
      console.log('❌ Password too short');
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }
    
    console.log('✅ Validation passed, creating new user...');
    
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    // 🔧 FIX: Generate a plain token and store it DIRECTLY (not hashed)
    // This ensures verify-email/route.js direct comparison works correctly
    console.log('🔑 Generating email verification token...');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Store plain token directly - NOT hashed
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.emailVerificationAttempts = 1;
    user.lastVerificationEmailSent = new Date();

    console.log('✅ Plain verification token stored in user object');
    
    console.log('💾 Saving user to database...');
    const savedUser = await user.save();
    console.log('✅ User saved successfully:', {
      userId: savedUser._id,
      email: savedUser.email,
      isEmailVerified: savedUser.isEmailVerified,
      tokenStored: !!savedUser.emailVerificationToken
    });
    
    const jwtToken = jwt.sign(
      { userId: savedUser._id, email: savedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ JWT token generated for user');
    
    const successResponse = {
      message: 'User created successfully! Please check your email to verify your account.',
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        isEmailVerified: savedUser.isEmailVerified,
      },
      token: jwtToken
    };
    
    console.log('📧 Attempting to send verification email...');
    
    try {
      const emailResult = await sendVerificationEmail(savedUser, verificationToken);
      
      console.log('✅ Verification email sent successfully:', {
        messageId: emailResult.messageId,
        accepted: emailResult.accepted
      });
      
      successResponse.emailSent = true;
      successResponse.emailStatus = 'sent';
      
      return NextResponse.json(successResponse, { status: 201 });
      
    } catch (emailError) {
      console.error('❌ EMAIL SENDING FAILED:', emailError.message);
      
      successResponse.emailSent = false;
      successResponse.emailStatus = 'failed';
      successResponse.emailError = emailError.message;
      successResponse.emailWarning = 'Account created successfully, but verification email could not be sent. You can request a new verification email from the verification page.';
      
      return NextResponse.json(successResponse, { status: 201 });
    }
    
  } catch (error) {
    console.error('❌ SIGNUP ERROR:', error.message);
    
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: 'Validation error', details: validationErrors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ 
      error: 'Signup failed', 
      details: error.message 
    }, { status: 500 });
  }
}