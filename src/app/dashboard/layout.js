// app/dashboard/layout.js
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

export default function DashboardLayout({ children }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const pathname = usePathname();

  // Handle hydration and app initialization
  useEffect(() => {
    setIsHydrated(true);
    
    // Simulate app loading for smooth UX
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Set up global styles and meta
  useEffect(() => {
    if (!isHydrated) return;

    // Set page title based on route
    const titles = {
      '/dashboard': 'Building Codes Assistant - Dashboard',
      '/dashboard/home': 'Building Codes Assistant - Regulation Search',
      '/dashboard/settings': 'Building Codes Assistant - Settings',
    };
    
    const title = titles[pathname] || 'Building Codes Assistant - Regulation Search';
    document.title = title;

    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'AI-powered building regulations and codes search assistant for architecture firms');
    }

    // Add global CSS variables for theming
    document.documentElement.style.setProperty('--app-primary', '#059669'); // Green for regulations
    document.documentElement.style.setProperty('--app-secondary', '#0d9488'); // Teal accent
    document.documentElement.style.setProperty('--app-background', '#f0fdf4'); // Light green background
  }, [isHydrated, pathname]);

  // Loading screen component
  const LoadingScreen = () => (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingContent}>
        <div className={styles.logoContainer}>
          <span className={styles.loadingLogo}>📋</span>
          <h1 className={styles.loadingTitle}>Building Codes AI</h1>
        </div>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Loading Building Regulations System...</p>
        <div className={styles.loadingProgress}>
          <div className={styles.progressBar}></div>
        </div>
      </div>
    </div>
  );

  // Show loading screen during initialization
  if (!isHydrated || !appReady) {
    return <LoadingScreen />;
  }

  return (
    <div className={styles.dashboardLayout}>
      {/* Global app container */}
      <div className={styles.appContainer}>
        {children}
      </div>

      {/* Global error boundary fallback */}
      <div id="error-boundary" className={styles.errorBoundary} style={{ display: 'none' }}>
        <div className={styles.errorContent}>
          <h2>Something went wrong</h2>
          <p>Please refresh the page to continue.</p>
          <button onClick={() => window.location.reload()} className={styles.refreshButton}>
            Refresh Page
          </button>
        </div>
      </div>

      {/* Global toast notifications */}
      <div id="toast-container" className={styles.toastContainer}></div>
    </div>
  );
}