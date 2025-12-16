// src/components/home/DocumentViewer/DocumentHeader.js
'use client';

import styles from './DocumentViewer.module.css';

export default function DocumentHeader({ title, page, totalPages, onClose }) {
  return (
    <div className={styles.documentHeader}>
      <div className={styles.documentInfo}>
        <h3 className={styles.documentTitle}>{title}</h3>
        {page && totalPages && (
          <span className={styles.pageInfo}>
            Page {page} of {totalPages}
          </span>
        )}
      </div>

      <button
        onClick={onClose}
        className={styles.closeButton}
        title="Close document viewer"
        aria-label="Close document viewer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={styles.closeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}