// src/app/api/user/theme/route.js - Theme Preference API Endpoint
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET;

// Helper function to get user from token
async function getUserFromToken(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return { error: 'No token provided', status: 401 };
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    await connectToDatabase();
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    if (user.isDeleted) {
      return { error: 'Account has been deleted', status: 403 };
    }

    return { user };
  } catch (error) {
    console.error('❌ Auth error:', error);
    return { error: 'Invalid token', status: 401 };
  }
}

// GET - Retrieve user's theme preference
export async function GET(request) {
  try {
    const authResult = await getUserFromToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user } = authResult;
    const theme = user.getThemePreference();

    console.log(`🎨 Retrieved theme preference for user ${user._id}: ${theme}`);

    return NextResponse.json({
      success: true,
      theme: theme,
      message: 'Theme preference retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error retrieving theme preference:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve theme preference' },
      { status: 500 }
    );
  }
}

// POST - Update user's theme preference
export async function POST(request) {
  try {
    const authResult = await getUserFromToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user } = authResult;
    const { theme } = await request.json();

    // Validate theme value
    if (!theme || !['light', 'dark'].includes(theme)) {
      return NextResponse.json(
        { error: 'Invalid theme. Must be "light" or "dark"' },
        { status: 400 }
      );
    }

    // Update theme preference
    await user.updateThemePreference(theme);

    console.log(`✅ Updated theme preference for user ${user._id}: ${theme}`);

    return NextResponse.json({
      success: true,
      theme: theme,
      message: `Theme preference updated to ${theme}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating theme preference:', error);
    
    if (error.message.includes('Invalid theme')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update theme preference' },
      { status: 500 }
    );
  }
}

// PUT - Alternative endpoint for updating theme (same as POST)
export async function PUT(request) {
  return POST(request);
}