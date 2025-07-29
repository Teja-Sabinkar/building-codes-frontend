// app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth/auth';

export async function GET() {
  try {
    // Get the current user from the auth token
    const currentUser = getCurrentUser();
    
    // If no user found in token
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Find the user in the database to get fresh data
    const user = await User.findById(currentUser.id);
    
    // If user not found in database
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return the user data
    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      }
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred while getting user data' },
      { status: 500 }
    );
  }
}