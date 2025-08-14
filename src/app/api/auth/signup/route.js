// app/api/auth/signup/route.js - PRODUCTION READY with Enhanced Email Debugging
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import { sendVerificationEmail } from '@/services/email-service';

export async function POST(request) {
  try {
    console.log('🚀 Starting user signup process...');
    
    // Connect to the database
    await connectToDatabase();
    console.log('✅ Database connected successfully');
    
    // Parse the request body
    const { name, email, password } = await request.json();
    
    console.log('📝 Signup request data:', {
      name: name,
      email: email,
      hasPassword: !!password,
      passwordLength: password ? password.length : 0
    });
    
    // Check if all required fields are provided
    if (!name || !email || !password) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }
    
    // Validate password length
    if (password.length < 8) {
      console.log('❌ Password too short');
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }
    
    console.log('✅ Validation passed, creating new user...');
    
    // Create a new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });
    
    // Generate email verification token
    console.log('🔑 Generating email verification token...');
    const verificationToken = user.createEmailVerificationToken();
    console.log('✅ Verification token generated:', {
      hasToken: !!verificationToken,
      tokenLength: verificationToken ? verificationToken.length : 0,
      tokenExpires: user.emailVerificationExpires
    });
    
    // Save the user
    console.log('💾 Saving user to database...');
    const savedUser = await user.save();
    console.log('✅ User saved successfully:', {
      userId: savedUser._id,
      email: savedUser.email,
      isEmailVerified: savedUser.isEmailVerified
    });
    
    // Generate JWT token for immediate login
    const jwtToken = jwt.sign(
      { userId: savedUser._id, email: savedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ JWT token generated for user');
    
    // Prepare success response
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
    
    // Send verification email with enhanced error handling and logging
    console.log('📧 Attempting to send verification email...');
    console.log('📧 Email service configuration check:', {
      hasEmailHost: !!process.env.EMAIL_HOST,
      emailHost: process.env.EMAIL_HOST,
      emailUser: process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_PASSWORD,
      emailFrom: process.env.EMAIL_FROM,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      nodeEnv: process.env.NODE_ENV
    });
    
    try {
      console.log('🔗 About to call sendVerificationEmail with:', {
        userId: savedUser._id,
        userEmail: savedUser.email,
        userName: savedUser.name,
        tokenLength: verificationToken.length
      });
      
      const emailResult = await sendVerificationEmail(savedUser, verificationToken);
      
      console.log('✅ Verification email sent successfully:', {
        messageId: emailResult.messageId,
        accepted: emailResult.accepted,
        rejected: emailResult.rejected,
        response: emailResult.response
      });
      
      // Email sent successfully
      successResponse.emailSent = true;
      successResponse.emailStatus = 'sent';
      
      return NextResponse.json(successResponse, { status: 201 });
      
    } catch (emailError) {
      console.error('❌ EMAIL SENDING FAILED - CRITICAL ERROR:', {
        error: emailError.message,
        stack: emailError.stack,
        code: emailError.code,
        command: emailError.command,
        userId: savedUser._id,
        userEmail: savedUser.email,
        timestamp: new Date().toISOString()
      });
      
      // Detailed error analysis
      if (emailError.message.includes('EAUTH')) {
        console.error('🔧 SMTP Authentication Error - Check Gmail App Password');
      } else if (emailError.message.includes('ECONNECTION')) {
        console.error('🔧 SMTP Connection Error - Check network/firewall');
      } else if (emailError.message.includes('NEXT_PUBLIC_APP_URL')) {
        console.error('🔧 Environment Variable Error - NEXT_PUBLIC_APP_URL missing');
      } else {
        console.error('🔧 Unknown Email Error - Check email service configuration');
      }
      
      // User is still created successfully, but email failed
      // Return success but with email failure warning
      successResponse.emailSent = false;
      successResponse.emailStatus = 'failed';
      successResponse.emailError = emailError.message;
      successResponse.emailWarning = 'Account created successfully, but verification email could not be sent. You can request a new verification email from your dashboard.';
      
      return NextResponse.json(successResponse, { status: 201 });
    }
    
  } catch (error) {
    console.error('❌ SIGNUP ERROR - CRITICAL FAILURE:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      timestamp: new Date().toISOString()
    });
    
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.log('❌ Validation errors:', validationErrors);
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