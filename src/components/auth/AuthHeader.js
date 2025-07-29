// components/auth/AuthHeader.js
import Link from 'next/link';
import styles from '@/components/auth/AuthCommon.module.css';

export default function AuthHeader() {
  return (
    <div className={styles.authHeader}>
      <Link href="/" className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </div>
        <span className={styles.logoText}>AI CAD</span>
      </Link>
      <h1 className={styles.heading}>
        AI-Powered Architectural Design
      </h1>
      <p className={styles.subheading}>
        Generate and edit professional 2D floor plans with natural language
      </p>
    </div>
  );
}