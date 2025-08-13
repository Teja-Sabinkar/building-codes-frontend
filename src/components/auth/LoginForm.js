// components/auth/LoginForm.js - With Smart Persistence Theme Logic and Updated Layout
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import styles from '@/components/auth/AuthCommon.module.css';

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 🆕 SMART PERSISTENCE: Apply guest theme on mount
  useEffect(() => {
    const applyGuestTheme = () => {
      try {
        // Check for guest theme preference (from previous logout)
        const guestTheme = localStorage.getItem('regGPT-guestTheme') || 'dark';
        const isDark = guestTheme === 'dark';
        
        console.log('🎨 Login page applying guest theme:', guestTheme);
        
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
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // 🆕 SMART PERSISTENCE: Clear guest theme on successful login
        localStorage.removeItem('regGPT-guestTheme');
        console.log('🧹 Cleared guest theme - account preference will take over');
        
        router.push('/dashboard/home');
      } else {
        setErrors({ 
          form: result.error || 'Invalid email or password' 
        });
      }
      
    } catch (error) {
      setErrors({ 
        form: 'Invalid email or password' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <h2 className={styles.formTitle}>Log In</h2>
        
        {errors.form && (
          <div className={styles.errorMessage}>
            {errors.form}
          </div>
        )}
        
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
        
        {/* 🆕 UPDATED: Remember me and Forgot password on same line */}
        <div className={styles.formGroup}>
          <div className="flex justify-between items-center">
            <label className={styles.checkboxGroup}>
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span className={styles.checkboxLabel}>Remember me</span>
            </label>
            <Link 
              href="/auth/forgot-password" 
              className={styles.link}
            >
              Forgot password?
            </Link>
          </div>
        </div>
        
        <div className="flex items-center justify-center">
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className={styles.loadingSpinner}></div>
                <span className="ml-2">Logging in...</span>
              </>
            ) : (
              'Log In'
            )}
          </button>
        </div>
      </form>
      
      <div className={styles.formFooter}>
        <p>
          Don't have an account?{' '}
          <Link href="/auth/signup" className={styles.link}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}