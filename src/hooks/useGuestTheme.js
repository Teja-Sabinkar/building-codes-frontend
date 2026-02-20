// src/hooks/useGuestTheme.js - Guest Theme Management Hook
'use client';

import { useState, useEffect } from 'react';

/**
 * Hook for managing theme preferences for guest (non-authenticated) users
 * Provides theme persistence across sessions using localStorage
 */
export function useGuestTheme() {
  const [guestTheme, setGuestTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);

  // Load guest theme preference on mount
  useEffect(() => {
    try {
      const savedGuestTheme = localStorage.getItem('regGPT-guestTheme');
      if (savedGuestTheme && (savedGuestTheme === 'light' || savedGuestTheme === 'dark')) {
        setGuestTheme(savedGuestTheme);
        console.log('🎨 Loaded guest theme preference:', savedGuestTheme);
      } else {
        // No guest preference found, check if user was previously logged in
        const previousUserTheme = localStorage.getItem('regGPT-darkMode');
        if (previousUserTheme) {
          const theme = previousUserTheme === 'true' ? 'dark' : 'light';
          setGuestTheme(theme);
          // Save as guest preference
          localStorage.setItem('regGPT-guestTheme', theme);
          console.log('🔄 Migrated user theme to guest preference:', theme);
        }
      }
    } catch (error) {
      console.error('❌ Error loading guest theme:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply theme to document
  const applyGuestTheme = (theme) => {
    try {
      // Apply to document elements for guest users
      if (theme === 'dark') {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
        document.documentElement.style.backgroundColor = '#1a1a1a';
        document.body.style.backgroundColor = '#1a1a1a';
        document.documentElement.style.color = '#e5e5e5';
        document.body.style.color = '#e5e5e5';
      } else {
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
        document.documentElement.style.backgroundColor = '#ffffff';
        document.body.style.backgroundColor = '#ffffff';
        document.documentElement.style.color = '#1f2937';
        document.body.style.color = '#1f2937';
      }
      
      console.log('✅ Applied guest theme:', theme);
    } catch (error) {
      console.error('❌ Error applying guest theme:', error);
    }
  };

  // Update guest theme preference
  const updateGuestTheme = (newTheme) => {
    try {
      if (newTheme !== 'light' && newTheme !== 'dark') {
        console.error('❌ Invalid theme value:', newTheme);
        return false;
      }

      setGuestTheme(newTheme);
      localStorage.setItem('regGPT-guestTheme', newTheme);
      applyGuestTheme(newTheme);
      
      console.log('🎨 Updated guest theme preference:', newTheme);
      return true;
    } catch (error) {
      console.error('❌ Error updating guest theme:', error);
      return false;
    }
  };

  // Get current guest theme
  const getGuestTheme = () => {
    try {
      const savedTheme = localStorage.getItem('regGPT-guestTheme');
      return savedTheme || 'dark';
    } catch (error) {
      console.error('❌ Error getting guest theme:', error);
      return 'light';
    }
  };

  return {
    guestTheme,
    isLoading,
    updateGuestTheme,
    applyGuestTheme,
    getGuestTheme
  };
}

/**
 * Utility function to save current theme as guest preference during logout
 * This should be called BEFORE clearing authentication state
 */
export function saveThemeOnLogout() {
  try {
    console.log('💾 Saving theme preference for guest session...');
    
    // Check current theme from various sources
    let currentTheme = 'light';
    
    // Priority 1: Check if dark-mode class is applied to body/html
    if (document.body.classList.contains('dark-mode') || 
        document.documentElement.classList.contains('dark-mode')) {
      currentTheme = 'dark';
      console.log('🔍 Detected dark mode from DOM classes');
    } 
    // Priority 2: Check localStorage for current user theme
    else {
      const userTheme = localStorage.getItem('regGPT-darkMode');
      if (userTheme === 'true') {
        currentTheme = 'dark';
        console.log('🔍 Detected dark mode from localStorage');
      }
    }
    
    // Save as guest preference
    localStorage.setItem('regGPT-guestTheme', currentTheme);
    console.log('✅ Saved theme as guest preference:', currentTheme);
    
    return currentTheme;
    
  } catch (error) {
    console.error('❌ Error saving theme on logout:', error);
    return 'light';
  }
}

/**
 * Apply theme immediately for guest users (for login/landing pages)
 */
export function applyGuestThemeImmediate() {
  try {
    const guestTheme = localStorage.getItem('regGPT-guestTheme') || 'dark';
    
    if (guestTheme === 'dark') {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      document.documentElement.style.backgroundColor = '#1a1a1a';
      document.body.style.backgroundColor = '#1a1a1a';
      document.documentElement.style.color = '#e5e5e5';
      document.body.style.color = '#e5e5e5';
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
      document.documentElement.style.backgroundColor = '#ffffff';
      document.body.style.backgroundColor = '#ffffff';
      document.documentElement.style.color = '#1f2937';
      document.body.style.color = '#1f2937';
    }
    
    console.log('⚡ Applied guest theme immediately:', guestTheme);
    return guestTheme;
    
  } catch (error) {
    console.error('❌ Error applying immediate guest theme:', error);
    return 'light';
  }
}

/**
 * Check if guest has a saved theme preference
 */
export function hasGuestThemePreference() {
  try {
    const guestTheme = localStorage.getItem('regGPT-guestTheme');
    return guestTheme !== null && (guestTheme === 'light' || guestTheme === 'dark');
  } catch (error) {
    return false;
  }
}

/**
 * Clear all theme preferences (for complete reset)
 */
export function clearAllThemePreferences() {
  try {
    localStorage.removeItem('regGPT-guestTheme');
    localStorage.removeItem('regGPT-darkMode');
    console.log('🧹 Cleared all theme preferences');
  } catch (error) {
    console.error('❌ Error clearing theme preferences:', error);
  }
}

export default useGuestTheme;