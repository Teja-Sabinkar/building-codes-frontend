// components/auth/ForgotPasswordForm.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '@/components/auth/AuthCommon.module.css';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  if (isSubmitted) {
    return (
      <div className="w-full">
        <div className={styles.formContainer}>
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold mt-4 mb-2 text-gray-800">Check your email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <span className="font-medium">{email}</span>
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setIsSubmitted(false)}
                className={styles.link}
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

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <h2 className={styles.formTitle}>Reset Password</h2>
        <p className="text-gray-600 text-center mb-6">
          Enter your email and we'll send you a link to reset your password
        </p>
        
        {errors.form && (
          <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-md">
            {errors.form}
          </div>
        )}
        
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
        
        <div className="flex items-center justify-center">
          <button
            type="submit"
            className={`${styles.submitButton} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>
      </form>
      
      <div className={styles.formFooter}>
        <Link href="/auth/login" className={styles.link}>
          Back to login
        </Link>
      </div>
    </div>
  );
}