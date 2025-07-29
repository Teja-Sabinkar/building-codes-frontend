// app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
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
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }
    
    // Create a new user
    const user = new User({
      name,
      email,
      password,
    });
    
    // Generate email verification token
    const verificationToken = user.createEmailVerificationToken();
    
    // Save the user
    await user.save();
    
    // Send verification email
    await sendVerificationEmail(user, verificationToken);
    
    // Return success response (exclude password from response)
    return NextResponse.json({
      message: 'User created successfully! Please check your email to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Signup error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}