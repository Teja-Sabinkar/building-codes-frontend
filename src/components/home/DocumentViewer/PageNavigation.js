// src/components/home/DocumentViewer/PageNavigation.js - Page navigation controls
'use client';

import { useState } from 'react';
import styles from './DocumentViewer.module.css';

export default function PageNavigation({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  onJumpToPage,
  hasPrevious,
  hasNext
}) {
  const [jumpValue, setJumpValue] = useState('');

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpValue, 10);
    
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onJumpToPage(String(pageNum));
      setJumpValue('');
    } else {
      alert(`Please enter a valid page number between 1 and ${totalPages}`);
    }
  };

  const handleInputChange = (e) => {
    setJumpValue(e.target.value);
  };

  const handleInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJumpSubmit(e);
    }
  };

  return (
    <div className={styles.pageNavigation}>
      <button
        onClick={onPrevious}
        disabled={!hasPrevious}
        className={styles.navButton}
        title="Previous page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={styles.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>

      <div className={styles.jumpToPage}>
        <input
          type="number"
          min="1"
          max={totalPages}
          value={jumpValue}
          onChange={handleInputChange}
          onKeyPress={handleInputKeyPress}
          placeholder={String(currentPage)}
          className={styles.pageInput}
          title="Jump to page"
        />
        <button
          onClick={handleJumpSubmit}
          className={styles.goButton}
          disabled={!jumpValue}
          title="Go to page"
        >
          Go
        </button>
        <span className={styles.pageCount}>of {totalPages}</span>
      </div>

      <button
        onClick={onNext}
        disabled={!hasNext}
        className={styles.navButton}
        title="Next page"
      >
        Next
        <svg xmlns="http://www.w3.org/2000/svg" className={styles.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}