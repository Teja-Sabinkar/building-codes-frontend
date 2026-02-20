// app/auth/verify-email/page.js - FIXED: Handle missing email param + Smart Persistence Theme
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthHeader from '@/components/auth/AuthHeader';
import styles from './VerifyEmailPage.module.css';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendEmail, setResendEmail] = useState(email || ''); // 🔧 FIX: state for email input
  const [verificationStatus, setVerificationStatus] = useState({
    success: false,
    error: null,
    message: '',
  });

  // Smart Persistence: Apply guest theme on mount
  useEffect(() => {
    try {
      const guestTheme = localStorage.getItem('regGPT-guestTheme') || 'dark';
      if (guestTheme === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    } catch (error) {
      document.body.classList.remove('dark-mode');
    }
  }, []);

  // Sync resendEmail state if URL email param loads
  useEffect(() => {
    if (email) {
      setResendEmail(email);
    }
  }, [email]);

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (response.ok) {
        setVerificationStatus({ success: true, error: null, message: data.message });
      } else {
        setVerificationStatus({ success: false, error: data.error, message: '' });
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
    // 🔧 FIX: Use resendEmail state (which can be typed by user if URL param missing)
    const emailToUse = resendEmail.trim();

    if (!emailToUse) {
      alert('Please enter your email address below to receive a new verification link.');
      return;
    }

    // Basic email format validation
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(emailToUse)) {
      alert('Please enter a valid email address.');
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse })
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Verification email sent to ${emailToUse}! Check your inbox and spam folder.`);
      } else {
        alert(data.error || 'Failed to resend email. Please try again.');
      }
    } catch (error) {
      alert('Error sending email. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  // 🔧 FIX: Render email input if email is not present in URL
  const renderResendSection = () => (
    <div className="text-center py-4">
      {!email && (
        // Show email input field when email is not in URL params
        <div className={styles.inputWrapper}>
          <p className={styles.cardText} style={{ fontSize: '0.875rem' }}>
            Enter your email address to receive a new verification link:
          </p>
          <input
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="your@email.com"
            className={styles.emailInput}
          />
        </div>
      )}
      <p className={styles.cardText}>
        Please check your email for a verification link. Click the link in the email to verify your REG-GPT account.
      </p>
      <p className={styles.cardText}>
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
  );

  return (
    <div className={styles.verifyContainer}>
      <div className={styles.verifyWrapper}>
        <AuthHeader />
        
        <div className={styles.card}>
          <h2 className={`text-2xl font-bold mb-4 text-center ${styles.cardTitle}`}>
            Email Verification
          </h2>
          
          {isVerifying ? (
            <div className="text-center py-8">
              <div className={styles.loadingSpinner}></div>
              <p className={styles.cardText}>Verifying your email...</p>
            </div>
          ) : verificationStatus.success ? (
            <div className={styles.statusSuccess}>
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className={`text-xl font-medium mt-4 mb-2 ${styles.cardTitle}`}>Email Verified!</h3>
              <p className={styles.cardText}>{verificationStatus.message}</p>
              <Link
                href="/auth/login"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline transition-colors"
              >
                Log In to REG-GPT
              </Link>
            </div>
          ) : verificationStatus.error ? (
            <div className={styles.statusError}>
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className={`text-xl font-medium mt-4 mb-2 ${styles.cardTitle}`}>Verification Failed</h3>
              <p className={styles.cardError}>{verificationStatus.error}</p>
              <p className={styles.cardText}>
                If your verification link has expired, you can request a new one.
              </p>
              {!email && (
                <div className={styles.inputWrapper}>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your email to resend"
                    className={styles.emailInput}
                  />
                </div>
              )}
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </div>
          ) : (
            renderResendSection()
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className={styles.verifyContainer}>
        <div className={styles.verifyWrapper}>
          <AuthHeader />
          <div className={styles.card}>
            <div className="text-center py-8">
              <div className={styles.loadingSpinner}></div>
              <p className={styles.cardText}>Loading verification page...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}