// src/components/home/DocumentViewer/DocumentViewer.js
// ENHANCED WITH PDF BROWSE FEATURE + SUMMARIZE PAGE SUPPORT + 🔧 DEBUG LOGGING
// Supports both citation mode and browse mode with seamless switching

'use client';

import { useState, useEffect, useRef } from 'react';
import DocumentHeader from './DocumentHeader';
import PageNavigation from './PageNavigation';
import PDFPageViewer from './PDFPageViewer';
import PDFBrowseList from './PDFBrowseList';
import styles from './DocumentViewer.module.css';

// 🔧 FIX: Get backend URL with proper fallback (same as page.js)
const getBackendUrl = () => {
  // First try the environment variable
  if (process.env.NEXT_PUBLIC_RAG_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_RAG_BACKEND_URL;
  }
  
  // Fallback for production if env var is missing
  return 'https://building-codes-backend.onrender.com';
};

const BACKEND_URL = getBackendUrl();

export default function DocumentViewer({ 
  isOpen, 
  onClose,
  citation,                    // Citation mode data
  browseMode,                  // 🆕 NEW: Browse mode flag
  browseDocument,              // 🆕 NEW: Browse document name
  browseCountry,               // 🆕 NEW: Browse country
  browsePdfFilename,           // 🆕 NEW: Browse PDF filename
  browseDisplayName,           // 🆕 NEW: Browse display name
  currentRegion,
  onSummarizePage,
  onBrowseDocumentSelect,      // 🆕 NEW: Handler for browse document selection
  isMobile = false             // 🆕 NEW: Mobile detection
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
  
  const documentContentRef = useRef(null);
  const pageRefs = useRef({});

  // 🔧 Debug: Log backend URL on mount
  useEffect(() => {
    console.log('🔧 DocumentViewer Backend URL:', BACKEND_URL);
    console.log('🔧 DocumentViewer Env Var:', process.env.NEXT_PUBLIC_RAG_BACKEND_URL || 'NOT SET');
  }, []);

  /**
   * 🆕 NEW: Determine view mode based on props
   */
  useEffect(() => {
    if (browseMode && !browseDocument) {
      // Show browse list
      console.log('📚 View mode: Browse List');
      setViewMode('list');
      setDocumentData(null);
      setPdfUrl(null);
      setCurrentPage(null);
    } else if (browseMode && browseDocument) {
      // Show PDF from browse
      console.log('📄 View mode: Browse PDF', browseDocument);
      setViewMode('browse');
    } else if (citation) {
      // Show PDF from citation
      console.log('🔗 View mode: Citation PDF', citation.document);
      setViewMode('citation');
    } else {
      setViewMode(null);
    }
  }, [browseMode, browseDocument, citation]);

  /**
   * 🆕 ENHANCED: Handle Summarize Page Click (supports both citation and browse mode)
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
        document: citation?.document,
        country: citation?.country || currentRegion
      };
    } else {
      console.warn('⚠️ Cannot summarize: unknown view mode');
      return;
    }

    console.log('📝 Summarize Page clicked:', {
      document: documentInfo.document,
      page: currentPage,
      country: documentInfo.country,
      mode: viewMode
    });

    // Call parent callback to trigger summarization in chat
    if (onSummarizePage) {
      setIsSummarizing(true);
      try {
        await onSummarizePage({
          document: documentInfo.document,
          page: currentPage,
          country: documentInfo.country
        });
      } finally {
        setIsSummarizing(false);
      }
    }
  };

  /**
   * Map document name to PDF filename
   * EXACT mappings from your backend
   */
  const getPdfFilename = (document, country) => {
    const pdfMappings = {
      'India': {
        'NBC 2016-VOL.1': 'NBC 2016-VOL.1.pdf',
        'NBC 2016-VOL.2': 'NBC 2016-VOL.2.pdf',
      },
      'Scotland': {
        'Building standards technical handbook January 2025 domestic': 'Building standards technical handbook January 2025 domestic.pdf',
        'Building standards technical handbook January 2025 non-domestic': 'Building standards technical handbook January 2025 non-domestic.pdf',
        'single-building-assessment-specification-sba': 'single-building-assessment-specification-sba.pdf',
        'standards-single-building-assessments-additional-work-assessments': 'standards-single-building-assessments-additional-work-assessments.pdf',
        'task-group-recommendations-march-2024': 'task-group-recommendations-march-2024.pdf',
        'draft-scottish-advice-note-external-wall-systems-version-3-0': 'draft-scottish-advice-note-external-wall-systems-version-3-0.pdf',
        'determining-fire-risk-posed-external-wall-systems-existing-multistorey-residential-buildings': 'determining-fire-risk-posed-external-wall-systems-existing-multistorey-residential-buildings.pdf',
      },
      'Dubai': {
        'Dubai Building Code English 2021 Edition': 'Dubai Building Code_English_2021 Edition.pdf',
      }
    };

    const countryMappings = pdfMappings[country];
    if (!countryMappings) {
      console.warn(`⚠️ No PDF mappings for country: ${country}`);
      return null;
    }

    const pdfFilename = countryMappings[document];
    if (!pdfFilename) {
      console.warn(`⚠️ No PDF mapping for document: "${document}" in ${country}`);
      console.warn(`Available mappings:`, Object.keys(countryMappings));
      return null;
    }

    return pdfFilename;
  };

  /**
   * Zoom Controls
   */
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3.0)); // Max 300%
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5)); // Min 50%
  };

  const handleZoomReset = () => {
    setZoom(1.0); // Reset to 100%
  };

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Zoom shortcuts: Ctrl/Cmd + Plus/Minus
      if ((e.ctrlKey || e.metaKey) && e.key === '+') {
        e.preventDefault();
        handleZoomIn();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleZoomReset();
      }
      // Page navigation: Left/Right arrows
      else if (e.key === 'ArrowLeft') {
        handlePreviousPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, zoom, documentData, currentPage]);

  /**
   * 🆕 ENHANCED WITH DEBUG LOGGING: Load document - supports both citation and browse mode
   */
  useEffect(() => {
    if (!isOpen || viewMode === 'list' || viewMode === null) {
      // Don't load if closed, showing list, or no mode
      return;
    }

    const fetchDocument = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Determine document source
        let documentName, country, targetPage, pdfFilename;

        if (viewMode === 'browse') {
          // Browse mode
          documentName = browseDocument;
          country = browseCountry;
          targetPage = '1'; // Always start at page 1 for browse
          pdfFilename = browsePdfFilename || getPdfFilename(documentName, country);
          
          // 🔧 STEP 1: ENHANCED DEBUG LOGGING FOR BROWSE MODE
          console.log('📚 ===== BROWSE DOCUMENT DEBUG =====');
          console.log('📚 browseDocument:', browseDocument);
          console.log('📚 browseCountry:', browseCountry);
          console.log('📚 browsePdfFilename (from parent):', browsePdfFilename);
          console.log('📚 pdfFilename (final):', pdfFilename);
          console.log('📚 getPdfFilename fallback returns:', getPdfFilename(documentName, country));
          console.log('📚 ===================================');
          
          console.log('📚 Loading browse document:', { documentName, country, pdfFilename });
        } else if (viewMode === 'citation') {
          // Citation mode
          documentName = citation.document;
          country = citation.country || currentRegion;
          targetPage = citation.page;
          pdfFilename = getPdfFilename(documentName, country);
          
          console.log('🔗 Loading citation document:', { documentName, country, targetPage, pdfFilename });
        } else {
          throw new Error('Invalid view mode');
        }

        if (!pdfFilename) {
          console.error('❌ ===== PDF FILENAME ERROR =====');
          console.error('❌ PDF filename is NULL/undefined!');
          console.error('❌ documentName:', documentName);
          console.error('❌ country:', country);
          console.error('❌ browsePdfFilename:', browsePdfFilename);
          console.error('❌ getPdfFilename result:', getPdfFilename(documentName, country));
          console.error('❌ ================================');
          throw new Error(`PDF not configured for "${documentName}"`);
        }

        // 🔧 STEP 2: DEBUG PDF URL CONSTRUCTION
        console.log('🔗 ===== PDF URL CONSTRUCTION DEBUG =====');
        console.log('🔗 BACKEND_URL:', BACKEND_URL);
        console.log('🔗 country:', country);
        console.log('🔗 pdfFilename (before encoding):', pdfFilename);
        console.log('🔗 pdfFilename (after encoding):', encodeURIComponent(pdfFilename));
        
        // Construct PDF URL
        const pdfUrl = `${BACKEND_URL}/api/pdf/${country}/${encodeURIComponent(pdfFilename)}`;
        
        console.log('🔗 Full PDF URL:', pdfUrl);
        console.log('🔗 ===== COPY THIS URL AND TEST IN BROWSER ⬆️ =====');
        console.log('🔗 ======================================');
        
        setPdfUrl(pdfUrl);


        // 🔧 STEP 3: DEBUG CHUNKS FETCH (OPTIONAL - PDF loads without chunks)
        const chunksUrl = `${BACKEND_URL}/api/document/chunks?document=${encodeURIComponent(documentName)}&country=${encodeURIComponent(country)}`;
        
        console.log('📦 ===== CHUNKS FETCH DEBUG =====');
        console.log('📦 Fetching chunks for:', documentName);
        console.log('📦 Country:', country);
        console.log('📦 Chunks API URL:', chunksUrl);
        console.log('📦 ================================');

        // Fetch chunks for metadata (page count, sections) - OPTIONAL
        const response = await fetch(chunksUrl);

        console.log('📦 ===== CHUNKS RESPONSE DEBUG =====');
        console.log('📦 Response Status:', response.status);
        console.log('📦 Response OK:', response.ok);
        console.log('📦 Response Status Text:', response.statusText);

        // Initialize data with defaults
        let data = {
          totalPages: null,
          chunks: [],
          country: country
        };
        let hasChunks = false;

        if (!response.ok) {
          console.warn('⚠️ ===== CHUNKS NOT FOUND =====');
          console.warn('⚠️ Document chunks not available for:', documentName);
          console.warn('⚠️ Response Status:', response.status);
          try {
            const errorData = await response.json();
            console.warn('⚠️ Error details:', errorData);
          } catch (e) {
            console.warn('⚠️ Could not parse error response');
          }
          console.warn('⚠️ Impact: No page count, no summarize feature');
          console.warn('⚠️ But PDF will still load and display!');
          console.warn('⚠️ ================================');
          // Continue without chunks - PDF can still be viewed
        } else {
          data = await response.json();
          hasChunks = true;
          
          console.log('✅ ===== CHUNKS DATA RECEIVED =====');
          console.log('✅ Total Pages:', data.totalPages);
          console.log('✅ Chunks Count:', data.chunks?.length);
          console.log('✅ Has Highlights:', !!data.highlight_markers);
          console.log('✅ Highlight Markers Count:', data.highlight_markers?.length || 0);
          if (data.chunks && data.chunks.length > 0) {
            console.log('✅ First Chunk Metadata:', data.chunks[0]?.metadata);
            console.log('✅ First Chunk Page:', data.chunks[0]?.page);
          }
          console.log('✅ ==================================');
        }

        // Build pages array from chunks (if available)
        const pages = hasChunks && data.chunks ? data.chunks.map(chunk => ({
          number: String(chunk.page || chunk.metadata?.page || '1'),
          content: chunk.text,
          metadata: chunk.metadata
        })) : [];

        // Set document data
        setDocumentData({
          pages: pages,
          totalPages: data.totalPages || pages.length,
          documentName: documentName,
          title: browseDisplayName || citation?.displayName || documentName
        });

        // Set target page
        setCurrentPage(targetPage || '1');

        // Handle highlights for citation mode
        if (viewMode === 'citation' && citation?.highlight_markers) {
          console.log('🎨 Setting highlight markers:', {
            count: citation.highlight_markers.length,
            markers: citation.highlight_markers
          });
        }

        // Reset zoom on document change
        setZoom(1.0);

      } catch (err) {
        console.error('❌ ===== DOCUMENT LOAD ERROR =====');
        console.error('❌ Error:', err);
        console.error('❌ Error Message:', err.message);
        console.error('❌ Error Stack:', err.stack);
        console.error('❌ ================================');
        setError(err.message || 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [viewMode, citation, browseDocument, browseCountry, browsePdfFilename, browseDisplayName, isOpen, currentRegion]);

  /**
   * Handle page navigation
   */
  const handlePreviousPage = () => {
    if (!documentData || !currentPage) return;
    
    const pageNumbers = documentData.pages.map(p => String(p.number));
    const currentIndex = pageNumbers.indexOf(String(currentPage));
    
    if (currentIndex > 0) {
      const newPage = pageNumbers[currentIndex - 1];
      setCurrentPage(newPage);
    }
  };

  const handleNextPage = () => {
    if (!documentData || !currentPage) return;
    
    const pageNumbers = documentData.pages.map(p => String(p.number));
    const currentIndex = pageNumbers.indexOf(String(currentPage));
    
    if (currentIndex < pageNumbers.length - 1) {
      const newPage = pageNumbers[currentIndex + 1];
      setCurrentPage(newPage);
    }
  };

  const handleJumpToPage = (pageNumber) => {
    if (!documentData) return;
    
    const pageNumbers = documentData.pages.map(p => String(p.number));
    if (pageNumbers.includes(String(pageNumber))) {
      setCurrentPage(String(pageNumber));
    } else {
      console.warn(`⚠️ Page ${pageNumber} not found in document`);
    }
  };

  // Calculate pagination state
  const hasPrevious = documentData && currentPage ? 
    documentData.pages.findIndex(p => String(p.number) === String(currentPage)) > 0 : false;
  
  const hasNext = documentData && currentPage ? 
    documentData.pages.findIndex(p => String(p.number) === String(currentPage)) < documentData.pages.length - 1 : false;

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className={styles.documentViewerContainer}>
      <DocumentHeader 
        title={viewMode === 'list' ? `${browseCountry || currentRegion} Building Codes` : documentData?.title || 'Document Viewer'}
        page={currentPage}
        totalPages={documentData?.totalPages}
        onClose={onClose}
      />

      {/* 🆕 NEW: Browse List View */}
      {viewMode === 'list' && (
        <div className={styles.browseListWrapper}>
          <PDFBrowseList
            region={browseCountry || currentRegion}
            onDocumentSelect={onBrowseDocumentSelect}
            onClose={onClose}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* PDF Viewer (Citation or Browse mode) */}
      {(viewMode === 'citation' || viewMode === 'browse') && (
        <>
          {highlightStats.attempted > 0 && (
            <div className={styles.highlightStats}>
              <span className={styles.statsIcon}>✨</span>
              <span className={styles.statsText}>
                {highlightStats.successful} of {highlightStats.attempted} sections highlighted
              </span>
              {highlightStats.failed > 0 && (
                <span className={styles.statsWarning}>
                  ({highlightStats.failed} failed)
                </span>
              )}
            </div>
          )}

          {!isLoading && !error && documentData && (
            <PageNavigation
              currentPage={currentPage}
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

          {/* ZOOM FIX: No inline transform on documentContent - it should fill 100% */}
          <div 
            className={styles.documentContent}
            ref={documentContentRef}
          >
            {/* 🆕 ENHANCED: Floating Summarize Button - Works in both modes */}
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
                {/* Custom Popup Tooltip */}
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

            {/* ZOOM FIX: Apply transform to documentPages instead of documentContent */}
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