// app/auth/verify-email/page.js - With Smart Persistence Theme Logic + Suspense Fix + Resend Functionality
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthHeader from '@/components/auth/AuthHeader';
import styles from './VerifyEmailPage.module.css';

// 🚀 FIX: Separate component for useSearchParams to wrap in Suspense
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    success: false,
    error: null,
    message: '',
  });

  // 🆕 SMART PERSISTENCE: Apply guest theme on mount
  useEffect(() => {
    const applyGuestTheme = () => {
      try {
        // Check for guest theme preference (from previous logout)
        const guestTheme = localStorage.getItem('regGPT-guestTheme') || 'dark';
        const isDark = guestTheme === 'dark';
        
        console.log('🎨 Verify Email page applying guest theme:', guestTheme);
        
        // Apply theme to document body
        if (isDark) {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
        
        console.log('✅ Guest theme applied:', isDark ? 'dark' : 'light');
      } catch (error) {
        console.error('❌ Error applying guest theme:', error);
        // Default to light theme on error
        document.body.classList.remove('dark-mode');
      }
    };

    applyGuestTheme();
  }, []);

  useEffect(() => {
    // If token is provided in the URL, verify it automatically
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    setIsVerifying(true);
    
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setVerificationStatus({
          success: true,
          error: null,
          message: data.message,
        });
      } else {
        setVerificationStatus({
          success: false,
          error: data.error,
          message: '',
        });
      }
    } catch (error) {
      setVerificationStatus({
        success: false,
        error: 'An error occurred during verification. Please try again.',
        message: '',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      alert('Email not found. Please sign up again.');
      return;
    }

    setIsResending(true);
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('New verification email sent! Check your inbox and spam folder.');
      } else {
        alert(data.error || 'Failed to resend email. Please try again.');
      }
    } catch (error) {
      alert('Error sending email. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <AuthHeader />
        
        <div className={styles.card}>
          <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
            Email Verification
          </h2>
          
          {isVerifying ? (
            <div className="text-center py-8">
              <div className={styles.loadingSpinner}></div>
              <p className="text-gray-600 mt-4">Verifying your email...</p>
            </div>
          ) : verificationStatus.success ? (
            <div className={styles.statusSuccess}>
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-800 mt-4 mb-2">Email Verified!</h3>
              <p className="text-gray-600 mb-6">{verificationStatus.message}</p>
              <Link
                href="/auth/login"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline transition-colors"
              >
                Log In to REG-GPT
              </Link>
            </div>
          ) : verificationStatus.error ? (
            <div className={styles.statusError}>
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-800 mt-4 mb-2">Verification Failed</h3>
              <p className="text-red-600 mb-6">{verificationStatus.error}</p>
              <p className="text-gray-600 mb-4">
                If your verification link has expired, you can request a new one.
              </p>
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-6">
                Please check your email for a verification link. Click the link in the email to verify your REG-GPT account.
              </p>
              <p className="text-gray-600 mb-4">
                If you didn't receive the email, check your spam folder or request a new verification link.
              </p>
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 🚀 FIX: Main component wraps content in Suspense
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <AuthHeader />
          <div className={styles.card}>
            <div className="text-center py-8">
              <div className={styles.loadingSpinner}></div>
              <p className="text-gray-600 mt-4">Loading verification page...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}