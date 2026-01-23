// src/components/home/DocumentViewer/DocumentViewer.js
// ENHANCED WITH RECENTLY VIEWED PDFs FEATURE + PDF BROWSE + SUMMARIZE
// Supports citation mode, browse mode, and recently viewed tracking
'use client';

import { useState, useEffect, useRef } from 'react';
import DocumentHeader from './DocumentHeader';
import PageNavigation from './PageNavigation';
import PDFPageViewer from './PDFPageViewer';
import PDFBrowseList from './PDFBrowseList';
import RecentlyViewedList from './RecentlyViewedList';
import styles from './DocumentViewer.module.css';

// Get backend URL with proper fallback
const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_RAG_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_RAG_BACKEND_URL;
  }
  return 'https://building-codes-backend.onrender.com';
};

const BACKEND_URL = getBackendUrl();

export default function DocumentViewer({ 
  isOpen, 
  onClose,
  citation,                    // Citation mode data
  browseMode,                  // Browse mode flag
  browseDocument,              // Browse document name
  browseCountry,               // Browse country
  browsePdfFilename,           // Browse PDF filename
  browseDisplayName,           // Browse display name
  currentRegion,               // Current region (India, Scotland, Dubai)
  userId,                      // 🆕 NEW: User ID for tracking
  onSummarizePage,
  onBrowseDocumentSelect,      // Handler for browse document selection
  isMobile = false
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [zoom, setZoom] = useState(1.0);
  const [highlightedSections, setHighlightedSections] = useState([]);
  const [highlightStats, setHighlightStats] = useState({ attempted: 0, successful: 0, failed: 0 });
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [viewMode, setViewMode] = useState(null); // 'citation' | 'browse' | 'list'
  
  // 🆕 NEW: Recently viewed state
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(false);
  
  const documentContentRef = useRef(null);
  const pageRefs = useRef({});

  // Debug: Log backend URL on mount
  useEffect(() => {
    console.log('🔧 DocumentViewer Backend URL:', BACKEND_URL);
    console.log('🔧 DocumentViewer Env Var:', process.env.NEXT_PUBLIC_RAG_BACKEND_URL || 'NOT SET');
  }, []);

  /**
   * Determine view mode based on props
   */
  useEffect(() => {
    if (browseMode && !browseDocument) {
      console.log('📚 View mode: Browse List');
      setViewMode('list');
      setDocumentData(null);
      setPdfUrl(null);
      setCurrentPage(null);
    } else if (browseMode && browseDocument) {
      console.log('📄 View mode: Browse PDF', browseDocument);
      setViewMode('browse');
    } else if (citation) {
      console.log('🔗 View mode: Citation PDF', citation.document);
      setViewMode('citation');
    } else {
      setViewMode(null);
    }
  }, [browseMode, browseDocument, citation]);

  /**
   * 🆕 NEW: Track PDF view when document loads
   * Calls backend API to record viewing history
   */
  useEffect(() => {
    // Only track if we have all necessary data
    if (!documentData || !currentPage || !userId) {
      return;
    }

    // Get document info based on view mode
    let documentInfo;
    if (viewMode === 'browse') {
      documentInfo = {
        documentName: browseDocument,
        displayName: browseDisplayName,
        pdfFilename: browsePdfFilename,
        country: browseCountry
      };
    } else if (viewMode === 'citation') {
      documentInfo = {
        documentName: citation.document,
        displayName: citation.document, // Use document name as display name
        pdfFilename: citation.document + '.pdf',
        country: citation.country
      };
    } else {
      return; // Don't track for other modes
    }

    // Call tracking function
    trackPdfView(
      documentInfo.documentName,
      documentInfo.displayName,
      documentInfo.pdfFilename,
      currentPage,
      documentInfo.country
    );
  }, [documentData, currentPage, viewMode, userId]);

  /**
   * 🆕 NEW: Track PDF view in backend
   * Adds current PDF to user's recently viewed list
   */
  const trackPdfView = async (documentName, displayName, pdfFilename, page, country) => {
    try {
      console.log('📝 Tracking PDF view:', {
        documentName,
        displayName,
        page,
        country,
        userId
      });

      // Get JWT token
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('⚠️ No auth token, skipping tracking');
        return;
      }

      const response = await fetch(`/api/user/recently-viewed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentName,
          displayName,
          pdfFilename,
          page: parseInt(page, 10),
          country
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Failed to track PDF view:', errorData.error);
        return;
      }

      const data = await response.json();
      console.log('✅ PDF view tracked successfully:', data);

    } catch (err) {
      // Don't fail silently but don't block the user
      console.error('❌ Error tracking PDF view:', err);
    }
  };

  /**
   * 🆕 NEW: Toggle recently viewed panel
   */
  const handleToggleRecentlyViewed = () => {
    console.log('📚 Toggling recently viewed panel');
    setShowRecentlyViewed(!showRecentlyViewed);
  };

  /**
   * 🆕 NEW: Handle document selection from recently viewed
   */
  const handleRecentlyViewedSelect = (documentData) => {
    console.log('📄 Document selected from recently viewed:', documentData);
    
    // Close the recently viewed panel
    setShowRecentlyViewed(false);
    
    // Use the browse document select handler
    if (onBrowseDocumentSelect) {
      onBrowseDocumentSelect(documentData);
    }
  };

  /**
   * Handle Summarize Page Click (supports both citation and browse mode)
   */
  const handleSummarizePage = async () => {
    if (!currentPage || !documentData) {
      console.warn('⚠️ Cannot summarize: missing page or document data');
      return;
    }

    // Determine document source based on mode
    let documentInfo;
    if (viewMode === 'browse') {
      documentInfo = {
        document: browseDocument,
        country: browseCountry
      };
    } else if (viewMode === 'citation') {
      documentInfo = {
        document: citation.document,
        country: citation.country
      };
    } else {
      console.warn('⚠️ Cannot summarize: invalid view mode');
      return;
    }

    console.log('📝 Summarizing page:', {
      document: documentInfo.document,
      page: currentPage,
      country: documentInfo.country,
      viewMode
    });

    setIsSummarizing(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/summarize-page`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document: documentInfo.document,
          page: String(currentPage),
          country: documentInfo.country
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to summarize page');
      }

      const data = await response.json();
      console.log('✅ Page summarization successful:', data);

      // Call parent callback with summary
      if (onSummarizePage) {
        onSummarizePage({
          page: currentPage,
          summary: data.summary,
          document: documentInfo.document,
          country: documentInfo.country
        });
      }

    } catch (err) {
      console.error('❌ Summarization error:', err);
      alert(`Failed to summarize page: ${err.message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Load document when citation or browse document changes
  useEffect(() => {
    if (viewMode === 'citation' && citation) {
      loadDocument(citation.document, citation.page, citation.country);
    } else if (viewMode === 'browse' && browseDocument) {
      loadDocument(browseDocument, '1', browseCountry, browsePdfFilename);
    }
  }, [viewMode, citation, browseDocument, browseCountry, browsePdfFilename]);

  const loadDocument = async (documentName, targetPage, country, customPdfFilename = null) => {
    setIsLoading(true);
    setError(null);

    console.log('📄 Loading document:', {
      documentName,
      targetPage,
      country,
      customPdfFilename,
      viewMode
    });

    try {
      // Build chunks URL
      const chunksUrl = `${BACKEND_URL}/api/document/chunks?document=${encodeURIComponent(documentName)}&country=${encodeURIComponent(country)}`;
      
      console.log('🔗 Fetching chunks from:', chunksUrl);

      // Fetch document chunks (OPTIONAL - don't fail if missing)
      let chunks = [];
      try {
        const response = await fetch(chunksUrl);
        if (response.ok) {
          const data = await response.json();
          chunks = data.chunks || [];
          console.log(`✅ Loaded ${chunks.length} chunks`);
        } else {
          console.warn('⚠️ Chunks not available, continuing without them');
        }
      } catch (chunkError) {
        console.warn('⚠️ Error fetching chunks (non-critical):', chunkError);
      }

      // Build PDF URL
      const pdfFilename = customPdfFilename || `${documentName}.pdf`;
      const pdfUrl = `${BACKEND_URL}/api/pdf/${encodeURIComponent(country)}/${encodeURIComponent(pdfFilename)}`;
      
      console.log('🔗 PDF URL:', pdfUrl);
      setPdfUrl(pdfUrl);

      // Set document data
      setDocumentData({
        document: documentName,
        country: country,
        totalPages: chunks.length || 100, // Fallback to 100 if no chunks
        pages: chunks
      });

      setCurrentPage(targetPage);
      console.log(`✅ Document loaded: ${documentName}, Page: ${targetPage}`);

    } catch (err) {
      console.error('❌ Load document error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation handlers
  const handlePreviousPage = () => {
    if (currentPage && parseInt(currentPage) > 1) {
      const newPage = String(parseInt(currentPage) - 1);
      console.log(`⬅️ Previous page: ${newPage}`);
      setCurrentPage(newPage);
    }
  };

  const handleNextPage = () => {
    if (currentPage && documentData && parseInt(currentPage) < documentData.totalPages) {
      const newPage = String(parseInt(currentPage) + 1);
      console.log(`➡️ Next page: ${newPage}`);
      setCurrentPage(newPage);
    }
  };

  const handleJumpToPage = (pageNumber) => {
    console.log(`🔢 Jump to page: ${pageNumber}`);
    setCurrentPage(pageNumber);
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1.0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && hasPrevious) {
        handlePreviousPage();
      } else if (e.key === 'ArrowRight' && hasNext) {
        handleNextPage();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPage, documentData]);

  if (!isOpen) return null;

  const hasPrevious = currentPage && parseInt(currentPage) > 1;
  const hasNext = currentPage && documentData && parseInt(currentPage) < documentData.totalPages;

  return (
    <div className={`${styles.documentViewer} ${isOpen ? styles.open : ''}`}>
      {viewMode === 'list' ? (
        <div className={styles.browseWrapper}>
          <PDFBrowseList
            region={currentRegion}
            onDocumentSelect={onBrowseDocumentSelect}
            onClose={onClose}
            isMobile={isMobile}
          />
        </div>
      ) : (
        <>
          <DocumentHeader
            title={viewMode === 'browse' ? browseDisplayName : (citation?.document || 'Document')}
            page={currentPage}
            totalPages={documentData?.totalPages}
            onClose={onClose}
            // 🆕 NEW: Pass recently viewed button as right action
            rightActions={
              currentRegion && userId && (
                <button
                  onClick={handleToggleRecentlyViewed}
                  className={styles.recentlyViewedBtn}
                  title="Recently viewed documents"
                  aria-label="Show recently viewed documents"
                >
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </button>
              )
            }
          />

          {/* 🆕 NEW: Recently Viewed Panel */}
          {showRecentlyViewed && currentRegion && userId && (
            <RecentlyViewedList
              region={currentRegion}
              userId={userId}
              onDocumentSelect={handleRecentlyViewedSelect}
              onClose={() => setShowRecentlyViewed(false)}
            />
          )}

          {!isLoading && !error && documentData && (
            <PageNavigation
              currentPage={parseInt(currentPage)}
              totalPages={documentData.totalPages}
              onPrevious={handlePreviousPage}
              onNext={handleNextPage}
              onJumpToPage={handleJumpToPage}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
              zoom={zoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomReset={handleZoomReset}
            />
          )}

          <div 
            className={styles.documentContent}
            ref={documentContentRef}
          >
            {/* Floating Summarize Button */}
            {!isLoading && !error && documentData && currentPage && (
              <button
                onClick={handleSummarizePage}
                disabled={isSummarizing}
                className={styles.summarizeButton}
                aria-label="Summarize current page"
              >
                {isSummarizing ? (
                  <div className={styles.summarizeSpinner}></div>
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={styles.summarizeIcon} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                <span className={styles.tooltipPopup}>
                  <span className={styles.tooltipArrow}></span>
                  Summarize this page with A.I.
                </span>
              </button>
            )}

            {isLoading && (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Loading PDF...</p>
              </div>
            )}

            {error && (
              <div className={styles.errorState}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.errorIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3>Failed to Load Document</h3>
                <p>{error}</p>
                <button onClick={() => setError(null)} className={styles.retryButton}>
                  Try Again
                </button>
              </div>
            )}

            {!isLoading && !error && documentData && pdfUrl && currentPage && (
              <div 
                className={styles.documentPages}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease-in-out'
                }}
              >
                <div 
                  key={currentPage} 
                  ref={el => pageRefs.current[currentPage] = el}
                  data-page-number={currentPage}
                >
                  <PDFPageViewer
                    pdfUrl={pdfUrl}
                    pageNumber={parseInt(currentPage)}
                    highlightMarkers={viewMode === 'citation' ? (citation?.highlight_markers || []) : []}
                    onPageRendered={(pageNum) => console.log(`✅ Page ${pageNum} rendered`)}
                    onError={(error) => console.error(`❌ Page ${currentPage} error:`, error)}
                  />
                </div>
              </div>
            )}

            {!isLoading && !error && !documentData && viewMode !== 'list' && (
              <div className={styles.emptyState}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.emptyIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Click on a citation to view the document</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}