// app/auth/verify-email/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthHeader from '@/components/auth/AuthHeader';
import styles from './VerifyEmailPage.module.css';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    success: false,
    error: null,
    message: '',
  });

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
                className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline transition-colors"
              >
                Log In
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
                onClick={() => {
                  // This would be implemented to resend verification email
                  alert('Verification email resent. Please check your inbox.');
                }}
                className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline transition-colors"
              >
                Resend Verification Email
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-6">
                Please check your email for a verification link. Click the link in the email to verify your account.
              </p>
              <p className="text-gray-600 mb-4">
                If you didn't receive the email, check your spam folder or request a new verification link.
              </p>
              <button
                onClick={() => {
                  // This would be implemented to resend verification email
                  alert('Verification email resent. Please check your inbox.');
                }}
                className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline transition-colors"
              >
                Resend Verification Email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}