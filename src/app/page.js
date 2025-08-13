// app/page.js - REG-GPT Landing Page with Smart Persistence Theme Logic
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  // 🆕 SMART PERSISTENCE: Apply guest theme on mount
  useEffect(() => {
    const applyGuestTheme = () => {
      try {
        // Check for guest theme preference (from previous logout)
        const guestTheme = localStorage.getItem('regGPT-guestTheme') || 'dark';
        const isDark = guestTheme === 'dark';
        
        console.log('🎨 Landing page applying guest theme:', guestTheme);
        
        // Apply theme to document body
        if (isDark) {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
        
        console.log('✅ Guest theme applied to landing page:', isDark ? 'dark' : 'light');
      } catch (error) {
        console.error('❌ Error applying guest theme to landing page:', error);
        // Default to light theme on error
        document.body.classList.remove('dark-mode');
      }
    };

    applyGuestTheme();
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.logoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className={styles.brandText}>RegGPT</span>
          </div>
          <div className={styles.authButtons}>
            <Link href="/auth/login" className={styles.loginButton}>
              Log In
            </Link>
            <Link href="/auth/signup" className={styles.signupButton}>
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.heroSection}>
          <h1 className={styles.heroTitle}>
            AI Building Codes Assistant
          </h1>
          <p className={styles.heroDescription}>
            Get instant building code answers with official citations. 
            Ask about regulations, fire safety, and accessibility requirements.
          </p>
          
          <div className={styles.heroButtons}>
            <Link href="/auth/signup" className={styles.primaryButton}>
              Start Free Trial
            </Link>
            <Link href="/auth/login" className={styles.secondaryButton}>
              Log In
            </Link>
          </div>

          {/* Example */}
          <div className={styles.exampleCard}>
            <p className={styles.exampleLabel}>Try asking:</p>
            <p className={styles.exampleQuery}>"What are minimum ceiling heights for residential buildings?"</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.footerText}>
            © {new Date().getFullYear()} REG-GPT. Professional building code consultation for architecture firms.
          </p>
        </div>
      </footer>
    </div>
  );
}