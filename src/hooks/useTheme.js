// src/hooks/useTheme.js - Application-wide Theme Management Hook (Dark Default)
import { useState, useEffect, useCallback } from 'react';

export const useTheme = (user = null) => {
  const [theme, setTheme] = useState('dark'); // 🆕 CHANGED: 'light' → 'dark'
  const [isLoading, setIsLoading] = useState(false);

  // Load theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Priority 1: User object (fastest)
        if (user?.preferences?.theme) {
          setTheme(user.preferences.theme);
          applyThemeToDocument(user.preferences.theme);
          console.log(`🎨 Theme loaded from user object: ${user.preferences.theme}`);
          return;
        }

        // Priority 2: API call (most reliable)
        const token = getAuthToken();
        if (token) {
          const response = await fetch('/api/user/theme', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            setTheme(data.theme);
            applyThemeToDocument(data.theme);
            console.log(`🎨 Theme loaded from API: ${data.theme}`);
            return;
          }
        }

        // Priority 3: localStorage fallback
        const savedTheme = localStorage.getItem('regGPT-darkMode');
        if (savedTheme) {
          const themeValue = savedTheme === 'true' ? 'dark' : 'light';
          setTheme(themeValue);
          applyThemeToDocument(themeValue);
          console.log(`🎨 Theme loaded from localStorage: ${themeValue}`);
          return; // 🆕 ADDED: return to prevent final fallback
        }

        // 🆕 ADDED: Final fallback - apply default dark theme if no other source available
        console.log('🎨 No theme source found, applying default dark theme');
        setTheme('dark');
        applyThemeToDocument('dark');

      } catch (error) {
        console.error('❌ Error loading theme:', error);
        // Fallback to localStorage
        const savedTheme = localStorage.getItem('regGPT-darkMode');
        if (savedTheme) {
          const themeValue = savedTheme === 'true' ? 'dark' : 'light';
          setTheme(themeValue);
          applyThemeToDocument(themeValue);
        } else {
          // 🆕 ADDED: Error fallback - apply default dark theme
          console.log('🎨 Error fallback: applying default dark theme');
          setTheme('dark');
          applyThemeToDocument('dark');
        }
      }
    };

    loadTheme();
  }, [user]);

  // Helper function to get auth token
  const getAuthToken = () => {
    return localStorage.getItem('authToken') || 
           localStorage.getItem('token') || 
           sessionStorage.getItem('authToken');
  };

  // Apply theme to document
  const applyThemeToDocument = (themeValue) => {
    // Apply to settings page
    const settingsPage = document.querySelector('[data-settings-page]');
    if (settingsPage) {
      if (themeValue === 'dark') {
        settingsPage.classList.add('dark-mode');
      } else {
        settingsPage.classList.remove('dark-mode');
      }
    }

    // Apply to main application (if needed in future)
    const mainApp = document.querySelector('[data-main-app]');
    if (mainApp) {
      if (themeValue === 'dark') {
        mainApp.classList.add('dark-mode');
      } else {
        mainApp.classList.remove('dark-mode');
      }
    }

    // Apply to body for global styles
    const body = document.body;
    if (themeValue === 'dark') {
      body.classList.add('dark-mode');
    } else {
      body.classList.remove('dark-mode');
    }
  };

  // Function to update theme
  const updateTheme = useCallback(async (newTheme) => {
    if (!['light', 'dark'].includes(newTheme)) {
      console.error('❌ Invalid theme value:', newTheme);
      return false;
    }

    setIsLoading(true);

    try {
      // Update UI immediately
      setTheme(newTheme);
      applyThemeToDocument(newTheme);

      // Save to localStorage as backup
      localStorage.setItem('regGPT-darkMode', (newTheme === 'dark').toString());

      // Save to backend
      const token = getAuthToken();
      if (token) {
        const response = await fetch('/api/user/theme', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ theme: newTheme })
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Theme saved to backend: ${data.theme}`);
          return true;
        } else {
          console.error('❌ Failed to save theme to backend');
          // Don't revert - keep better UX
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error updating theme:', error);
      // Don't revert - keep better UX
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle theme function
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    return updateTheme(newTheme);
  }, [theme, updateTheme]);

  // Check if current theme is dark
  const isDark = theme === 'dark';

  return {
    theme,
    isDark,
    isLoading,
    updateTheme,
    toggleTheme,
    applyThemeToDocument
  };
};