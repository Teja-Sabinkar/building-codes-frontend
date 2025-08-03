// app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import { sendVerificationEmail } from '@/services/email-service';

export async function POST(request) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Parse the request body
    const { name, email, password } = await request.json();
    
    // Check if all required fields are provided
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }
    
    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }
    
    // Create a new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });
    
    // Generate email verification token
    const verificationToken = user.createEmailVerificationToken();
    
    // Save the user
    const savedUser = await user.save();
    
    // Generate JWT token for immediate login
    const jwtToken = jwt.sign(
      { userId: savedUser._id, email: savedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Send verification email (don't fail signup if email fails)
    try {
      await sendVerificationEmail(savedUser, verificationToken);
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      // Continue even if email fails - user is still created
    }
    
    return NextResponse.json({
      message: 'User created successfully! Please check your email to verify your account.',
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        isEmailVerified: savedUser.isEmailVerified,
      },
      token: jwtToken
    }, { status: 201 });
    
  } catch (error) {
    console.error('Signup error:', error);
    
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