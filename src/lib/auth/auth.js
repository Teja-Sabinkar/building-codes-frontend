// src/lib/auth/auth.js
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object with id, email, etc.
 * @returns {string} JWT token
 */
export function generateToken(user) {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    name: user.name,
    isEmailVerified: user.isEmailVerified
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'building-codes-assistant',
    audience: 'building-codes-users'
  });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'building-codes-assistant',
      audience: 'building-codes-users'
    });
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

/**
 * Get the current user from the JWT token in cookies
 * @returns {Object|null} Current user object or null if not authenticated
 */
export function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token');
    
    if (!token) {
      return null;
    }
    
    const decoded = verifyToken(token.value);
    return decoded;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Set authentication cookie with JWT token
 * @param {string} token - JWT token to set in cookie
 */
export function setAuthCookie(token) {
  const cookieStore = cookies();
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/'
  });
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie() {
  const cookieStore = cookies();
  
  cookieStore.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });
}

/**
 * Middleware function to check if user is authenticated
 * @param {Object} request - Next.js request object
 * @returns {Object|null} User object if authenticated, null otherwise
 */
export function requireAuth(request) {
  const user = getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Middleware function to check if user is authenticated and email is verified
 * @param {Object} request - Next.js request object
 * @returns {Object|null} User object if authenticated and verified, null otherwise
 */
export function requireVerifiedAuth(request) {
  const user = requireAuth(request);
  
  if (!user.isEmailVerified) {
    throw new Error('Email verification required');
  }
  
  return user;
}

/**
 * Generate a secure random token (for password reset, email verification, etc.)
 * @param {number} length - Length of the token (default: 32)
 * @returns {string} Random token
 */
export function generateSecureToken(length = 32) {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a token for secure storage
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
export function hashToken(token) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Check if a token matches its hashed version
 * @param {string} token - Plain token
 * @param {string} hashedToken - Hashed token to compare against
 * @returns {boolean} True if tokens match
 */
export function verifyHashedToken(token, hashedToken) {
  const tokenHash = hashToken(token);
  return tokenHash === hashedToken;
}

/**
 * Extract user info from request headers or cookies
 * @param {Object} request - Request object
 * @returns {Object|null} User info or null
 */
export function extractUserFromRequest(request) {
  try {
    // First try to get from cookies
    const user = getCurrentUser();
    if (user) return user;
    
    // Fallback to Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return verifyToken(token);
    }
    
    return null;
  } catch (error) {
    console.error('Extract user from request error:', error);
    return null;
  }
}

/**
 * Create a response with authentication error
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {Response} Next.js Response object
 */
export function createAuthErrorResponse(message = 'Authentication required', status = 401) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}