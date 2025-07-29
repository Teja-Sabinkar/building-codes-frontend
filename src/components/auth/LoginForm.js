// components/auth/LoginForm.js
'use client';

import { useState } from 'react';
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
          <div className="flex justify-between items-center mb-2">
            <label className={styles.formLabel} htmlFor="password">
              Password
            </label>
            <Link 
              href="/auth/forgot-password" 
              className={styles.link}
            >
              Forgot password?
            </Link>
          </div>
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
          <label className="flex items-center">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-600">Remember me</span>
          </label>
        </div>
        
        <div className="flex items-center justify-center">
          <button
            type="submit"
            className={`${styles.submitButton} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </div>
      </form>
      
      <div className={styles.formFooter}>
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/auth/signup" className={styles.link}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}