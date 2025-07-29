// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth/auth';

export async function POST() {
  try {
    // Clear the auth token cookie
    clearAuthCookie();
    
    // Return success response
    return NextResponse.json({
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}