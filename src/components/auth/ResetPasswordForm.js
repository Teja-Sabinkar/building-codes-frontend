// components/auth/ResetPasswordForm.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '@/components/auth/AuthCommon.module.css';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Get token from URL
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      // Token is required, redirect if not present
      setErrors({ form: 'Invalid or expired reset link' });
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }
      
      setIsSuccess(true);
      
    } catch (error) {
      setErrors({ 
        form: 'Failed to reset password. The link may be invalid or expired.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full">
        <div className={styles.formContainer}>
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold mt-4 mb-2 text-gray-800">Password Reset Successful</h2>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset.
            </p>
            <Link 
              href="/auth/login"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline transition-colors"
            >
              Log in with new password
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <h2 className={styles.formTitle}>Reset Your Password</h2>
        
        {errors.form && (
          <div className={styles.errorMessage}>
            {errors.form}
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="password">
            New Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="******************"
            value={formData.password}
            onChange={handleChange}
            className={`${styles.formInput} ${errors.password ? 'border-red-500' : ''}`}
          />
          {errors.password && (
            <p className={styles.formError}>{errors.password}</p>
          )}
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="confirmPassword">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="******************"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`${styles.formInput} ${errors.confirmPassword ? 'border-red-500' : ''}`}
          />
          {errors.confirmPassword && (
            <p className={styles.formError}>{errors.confirmPassword}</p>
          )}
        </div>
        
        <div className="flex items-center justify-center">
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading || !token}
          >
            {isLoading ? (
              <>
                <div className={styles.loadingSpinner}></div>
                <span className="ml-2">Resetting Password...</span>
              </>
            ) : (
              'Reset Password'
            )}
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