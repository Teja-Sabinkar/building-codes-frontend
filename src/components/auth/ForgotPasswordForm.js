// components/auth/ForgotPasswordForm.js - Fixed Overlapping Elements and Consistent Styling
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/components/auth/AuthCommon.module.css';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 🆕 SMART PERSISTENCE: Apply guest theme on mount
  useEffect(() => {
    const applyGuestTheme = () => {
      try {
        // Check for guest theme preference (from previous logout)
        const guestTheme = localStorage.getItem('regGPT-guestTheme') || 'dark';
        const isDark = guestTheme === 'dark';
        
        console.log('🎨 Forgot Password page applying guest theme:', guestTheme);
        
        // Apply theme to document body
        if (isDark) {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
        
        console.log('✅ Guest theme applied:', isDark ? 'dark' : 'light');
      } catch (error) {
        console.error('❌ Error applying guest theme:', error);
        // Default to dark theme on error (since we changed default to dark)
        document.body.classList.add('dark-mode');
      }
    };

    applyGuestTheme();
  }, []);

  const handleChange = (e) => {
    setEmail(e.target.value);
    
    // Clear error when user starts typing
    if (errors.email) {
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Real API call
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      setIsSubmitted(true);
      
    } catch (error) {
      setErrors({ 
        form: 'Failed to process request. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Success state - using consistent CSS module styling
  if (isSubmitted) {
    return (
      <div className="w-full">
        <div className={styles.formContainer}>
          <div style={{ textAlign: 'center' }}>
            {/* Success Icon */}
            <svg 
              style={{ 
                margin: '0 auto 1rem auto', 
                width: '3rem', 
                height: '3rem', 
                color: '#059669' 
              }} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            
            {/* Success Title */}
            <h2 className={styles.formTitle}>Check your email</h2>
            
            {/* Success Message */}
            <div className={styles.successMessage}>
              We've sent a password reset link to <strong>{email}</strong>
            </div>
            
            {/* Additional Info */}
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280', 
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              Didn't receive the email? Check your spam folder or try again.
            </p>
            
            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setIsSubmitted(false)}
                className={styles.link}
                style={{ 
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Try again
              </button>
              <Link href="/auth/login" className={styles.link}>
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main form - using consistent CSS module styling
  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <h2 className={styles.formTitle}>Reset Password</h2>
        
        {/* Description */}
        <p className={styles.subheading} style={{ marginBottom: '1.5rem' }}>
          Enter your email and we'll send you a link to reset your password
        </p>
        
        {/* Form Error */}
        {errors.form && (
          <div className={styles.errorMessage}>
            {errors.form}
          </div>
        )}
        
        {/* Email Field */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={handleChange}
            className={`${styles.formInput} ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && (
            <p className={styles.formError}>{errors.email}</p>
          )}
        </div>
        
        {/* Submit Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className={styles.loadingSpinner}></div>
                <span style={{ marginLeft: '0.5rem' }}>Sending...</span>
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </div>
      </form>
      
      {/* Footer */}
      <div className={styles.formFooter}>
        <Link href="/auth/login" className={styles.link}>
          Back to login
        </Link>
      </div>
    </div>
  );
}