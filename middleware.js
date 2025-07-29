// middleware.js
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';

export function middleware(request) {
  // Get the auth token from cookies
  const token = request.cookies.get('auth_token')?.value;
  
  // Check if we're on a protected route
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
  
  // Verify the token and extract user info
  const user = token ? verifyToken(token) : null;
  const isAuthenticated = !!user;
  
  // If trying to access a protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  // If trying to access auth routes when already authenticated
  if (isAuthRoute && isAuthenticated && !request.nextUrl.pathname.startsWith('/auth/verify-email')) {
    return NextResponse.redirect(new URL('/dashboard/home', request.url));
  }
  
  // If authenticated but email not verified (except for verification page)
  if (isAuthenticated && !user.isEmailVerified && 
      isProtectedRoute && !request.nextUrl.pathname.startsWith('/auth/verify-email')) {
    return NextResponse.redirect(new URL('/auth/verify-email', request.url));
  }
  
  return NextResponse.next();
}

// Configure which paths should be processed by the middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*'
  ],
};