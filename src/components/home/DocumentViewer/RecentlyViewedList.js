// src/components/home/DocumentViewer/RecentlyViewedList.js
// Recently Viewed PDFs List Component - Displays history of recently viewed documents
'use client';

import { useState, useEffect } from 'react';
import styles from './RecentlyViewedList.module.css';

// Helper function to format relative time
function formatRelativeTime(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Get backend URL with proper fallback
const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_RAG_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_RAG_BACKEND_URL;
  }
  return 'https://building-codes-backend.onrender.com';
};

const BACKEND_URL = getBackendUrl();

export default function RecentlyViewedList({ 
  region,           // Current region (India, Scotland, Dubai)
  userId,           // Current user ID (optional, uses JWT from localStorage)
  onDocumentSelect, // Callback when PDF is clicked
  onClose           // Callback to close the list
}) {
  const [recentPdfs, setRecentPdfs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch recently viewed PDFs on mount or when region changes
  useEffect(() => {
    if (region) {
      fetchRecentlyViewed();
    }
  }, [region]);

  const fetchRecentlyViewed = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('📚 Fetching recently viewed PDFs:', { region, userId });

      // Get JWT token from localStorage
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Build URL with region parameter
      const url = `/api/user/recently-viewed?region=${encodeURIComponent(region)}`;

      console.log('🔗 Fetching from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch recently viewed PDFs');
      }

      const data = await response.json();
      console.log('✅ Fetched recently viewed PDFs:', {
        count: data.count,
        pdfs: data.pdfs
      });

      setRecentPdfs(data.pdfs || []);
    } catch (err) {
      console.error('❌ Error fetching recently viewed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfClick = (pdf) => {
    console.log('📄 PDF clicked in recently viewed:', {
      documentName: pdf.documentName,
      page: pdf.page,
      country: pdf.country
    });

    // Call parent handler to open PDF
    onDocumentSelect({
      documentName: pdf.documentName,
      pdfFilename: pdf.pdfFilename,
      country: pdf.country,
      displayName: pdf.displayName,
      page: pdf.page  // Open at last viewed page
    });

    // Close the recently viewed panel
    onClose();
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={styles.recentlyViewedPanel}>
        <div className={styles.header}>
          <h4 className={styles.title}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={styles.icon} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            Recently Viewed ({region})
          </h4>
          <button onClick={onClose} className={styles.closeBtn} title="Close">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={styles.closeIcon} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>

        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={styles.recentlyViewedPanel}>
        <div className={styles.header}>
          <h4 className={styles.title}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={styles.icon} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            Recently Viewed ({region})
          </h4>
          <button onClick={onClose} className={styles.closeBtn} title="Close">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={styles.closeIcon} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>

        <div className={styles.error}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={styles.errorIcon} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className={styles.errorText}>Failed to load history</p>
          <p className={styles.errorDetail}>{error}</p>
          <button onClick={fetchRecentlyViewed} className={styles.retryBtn}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render main content
  return (
    <div className={styles.recentlyViewedPanel}>
      {/* Header */}
      <div className={styles.header}>
        <h4 className={styles.title}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={styles.icon} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          Recently Viewed ({region})
        </h4>
        <button onClick={onClose} className={styles.closeBtn} title="Close" aria-label="Close recently viewed panel">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={styles.closeIcon} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      </div>

      {/* PDF List */}
      <div className={styles.pdfList}>
        {recentPdfs.length === 0 ? (
          <div className={styles.emptyState}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={styles.emptyIcon} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <p className={styles.emptyText}>No recently viewed documents</p>
            <p className={styles.emptySubtext}>Documents you view will appear here</p>
          </div>
        ) : (
          recentPdfs.map((pdf, index) => (
            <button
              key={`${pdf.documentName}-${index}`}
              onClick={() => handlePdfClick(pdf)}
              className={styles.pdfItem}
              title={`Open ${pdf.displayName} at page ${pdf.page}`}
            >
              <div className={styles.pdfIcon}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
                  />
                </svg>
              </div>
              
              <div className={styles.pdfInfo}>
                <p className={styles.pdfName}>{pdf.displayName}</p>
                <span className={styles.pdfMeta}>
                  Page {pdf.page} • {formatRelativeTime(pdf.viewedAt)}
                </span>
              </div>

              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={styles.arrowIcon} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            </button>
          ))
        )}
      </div>
    </div>
  );
}