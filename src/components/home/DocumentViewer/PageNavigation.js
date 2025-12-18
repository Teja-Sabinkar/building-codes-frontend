// src/components/home/DocumentViewer/PageNavigation.js - Page navigation controls with zoom
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
  hasNext,
  zoom = 1.0,
  onZoomIn,
  onZoomOut,
  onZoomReset
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

  // Format zoom percentage for display
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className={styles.pageNavigation}>
      {/* Page Navigation Controls */}
      <div className={styles.navGroup}>
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={styles.navButton}
          title="Previous page (Left arrow)"
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
          title="Next page (Right arrow)"
        >
          Next
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Zoom Controls */}
      <div className={styles.zoomControls}>
        <button
          onClick={onZoomOut}
          disabled={zoom <= 0.5}
          className={styles.zoomButton}
          title="Zoom out (Ctrl + -)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.zoomIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>

        <button
          onClick={onZoomReset}
          className={styles.zoomDisplay}
          title="Reset zoom to 100%"
        >
          {zoomPercent}%
        </button>

        <button
          onClick={onZoomIn}
          disabled={zoom >= 3.0}
          className={styles.zoomButton}
          title="Zoom in (Ctrl + +)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.zoomIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </button>
      </div>
    </div>
  );
}