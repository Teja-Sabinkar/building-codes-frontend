// components/auth/SignupForm.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import styles from '@/components/auth/AuthCommon.module.css';

export default function SignupForm() {
  const router = useRouter();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
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
      const result = await signup(formData.name, formData.email, formData.password);
      
      if (result.success) {
        setIsSuccess(true);
        setSuccessMessage(result.message);
        // Redirect to verification page
        setTimeout(() => {
          router.push('/auth/verify-email');
        }, 3000);
      } else {
        setErrors({ 
          form: result.error || 'Failed to create account. Please try again.' 
        });
      }
      
    } catch (error) {
      setErrors({ 
        form: 'Failed to create account. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <h2 className={styles.formTitle}>Create Account</h2>
        
        {errors.form && (
          <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-md">
            {errors.form}
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Your full name"
            value={formData.name}
            onChange={handleChange}
            className={`${styles.formInput} ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && (
            <p className={styles.formError}>{errors.name}</p>
          )}
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            className={`${styles.formInput} ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && (
            <p className={styles.formError}>{errors.email}</p>
          )}
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="password">
            Password
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
            Confirm Password
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
        
        <div className={styles.formGroup}>
          <label className="flex items-start">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-600">
              I agree to the{' '}
              <Link href="/terms" className={styles.link}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className={styles.link}>
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className={styles.formError}>{errors.agreeToTerms}</p>
          )}
        </div>
        
        <div className="flex items-center justify-center">
          <button
            type="submit"
            className={`${styles.submitButton} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </div>
      </form>
      
      <div className={styles.formFooter}>
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className={styles.link}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}