// src/app/api/auth/me/route.js - Enhanced with Theme Support
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request) {
  try {
    // Get token from Authorization header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Connect to database
    await connectToDatabase();
    
    // Find user by ID from token
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 🆕 CHECK FOR DELETED ACCOUNT
    if (user.isDeleted === true) {
      console.log(`🚫 Deleted account access attempt: ${user._id} - ${user.originalEmail || user.email}`);
      return NextResponse.json(
        { error: 'Account has been deleted' },
        { status: 403 }
      );
    }

    // 🎨 INCLUDE THEME PREFERENCE IN RESPONSE
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      profile: user.profile,
      usageStats: user.usageStats,
      preferences: {
        ...user.preferences,
        theme: user.getThemePreference() // Ensure theme is included
      }
    };

    console.log(`✅ User authenticated: ${user.email} - Theme: ${userResponse.preferences.theme}`);

    return NextResponse.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Auth verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}