// app/auth/layout.js - Fixed with REG-GPT branding and dark mode support
'use client';

import { useEffect } from 'react';

export default function AuthLayout({ children }) {
  // Apply dark mode class to body for consistent theming
  useEffect(() => {
    const applyGuestTheme = () => {
      try {
        // Check for guest theme preference (from previous logout or default)
        const guestTheme = localStorage.getItem('regGPT-guestTheme') || 'dark';
        const isDark = guestTheme === 'dark';
        
        console.log('🎨 Auth Layout applying guest theme:', guestTheme);
        
        // Apply theme to document body for consistent background
        if (isDark) {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
        
        console.log('✅ Auth Layout theme applied:', isDark ? 'dark' : 'light');
      } catch (error) {
        console.error('⚠️ Error applying auth layout theme:', error);
        // Default to dark theme on error
        document.body.classList.add('dark-mode');
      }
    };

    applyGuestTheme();
    
    // Cleanup function to avoid memory leaks
    return () => {
      // Don't remove dark-mode class on unmount as user might navigate to other auth pages
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark-mode:bg-gray-900 transition-colors duration-300">
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        {children}
      </main>
      
      <footer className="py-4 text-center text-sm text-gray-500 dark-mode:text-gray-400 transition-colors duration-300">
        <p>© {new Date().getFullYear()} REG-GPT. All rights reserved.</p>
      </footer>
      
      <style jsx global>{`
        /* Ensure consistent dark mode styling for auth layout */
        :global(.dark-mode) .min-h-screen {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a3a2e 100%);
        }
        
        /* Default light mode background */
        .min-h-screen {
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%);
        }
        
        /* Footer text styling */
        :global(.dark-mode) footer p {
          color: #9ca3af;
        }
        
        footer p {
          color: #6b7280;
        }
        
        /* Prevent horizontal overflow */
        :global(body) {
          overflow-x: hidden;
          max-width: 100vw;
        }
        
        /* Box sizing for all elements */
        :global(*, *::before, *::after) {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}