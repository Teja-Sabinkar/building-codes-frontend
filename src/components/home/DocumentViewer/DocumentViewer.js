// src/components/home/DocumentViewer/DocumentViewer.js
// HYBRID VERSION: PDF.js Rendering + Text-Based Highlighting
// PERFORMANCE FIX: Renders ONLY the current page instead of all pages
// ZOOM FEATURE: Supports zoom in/out with keyboard shortcuts (FIXED: Zoom applied to pages, not container)

'use client';

import { useState, useEffect, useRef } from 'react';
import DocumentHeader from './DocumentHeader';
import PageNavigation from './PageNavigation';
import PDFPageViewer from './PDFPageViewer';
import styles from './DocumentViewer.module.css';

export default function DocumentViewer({ 
  isOpen, 
  onClose,
  citation, // { document, page, country, highlight_markers }
  currentRegion 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [zoom, setZoom] = useState(1.0);
  const [highlightedSections, setHighlightedSections] = useState([]);
  const [highlightStats, setHighlightStats] = useState({ attempted: 0, successful: 0, failed: 0 });
  
  const documentContentRef = useRef(null);
  const pageRefs = useRef({});

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
      // Page navigation: Arrow keys
      else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePreviousPage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextPage();
      }
      // Close: Escape key
      else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPage, documentData]);

  // Update current page when citation changes
  useEffect(() => {
    if (citation?.page) {
      setCurrentPage(citation.page);
    }
  }, [citation]);

  // Fetch document data when citation changes
  useEffect(() => {
    if (!isOpen || !citation) return;

    const fetchDocument = async () => {
      setIsLoading(true);
      setError(null);
      setHighlightedSections([]);
      setHighlightStats({ attempted: 0, successful: 0, failed: 0 });

      try {
        const country = citation.country || currentRegion || 'Scotland';
        
        console.log('📄 Fetching document:', {
          document: citation.document,
          page: citation.page,
          country: country,
          hasHighlightMarkers: !!citation.highlight_markers
        });

        // Get PDF filename
        const pdfFilename = getPdfFilename(citation.document, country);
        if (!pdfFilename) {
          throw new Error(`PDF not configured for "${citation.document}"`);
        }

        // Construct PDF URL
        const backendUrl = process.env.NEXT_PUBLIC_RAG_BACKEND_URL || 'http://localhost:8000';
        const pdfUrl = `${backendUrl}/api/pdf/${country}/${encodeURIComponent(pdfFilename)}`;
        
        setPdfUrl(pdfUrl);
        console.log('📄 PDF URL:', pdfUrl);

        // Fetch chunks for metadata (page count, sections)
        const response = await fetch(
          `${backendUrl}/api/document/chunks?document=${encodeURIComponent(citation.document)}&country=${encodeURIComponent(country)}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch document');
        }

        const data = await response.json();

        console.log('✅ Document loaded:', {
          totalPages: data.totalPages,
          chunksLoaded: data.chunks?.length,
          citationPage: citation.page
        });

        // Format chunks into pages structure
        const pages = data.chunks.map(chunk => ({
          number: chunk.page,
          content: chunk.content,
          section: chunk.section
        }));

        setDocumentData({
          title: citation.document,
          country: data.country,
          totalPages: data.totalPages,
          pages: pages,
          pageMap: pages.reduce((map, page) => {
            map[page.number] = page;
            return map;
          }, {})
        });

        console.log('✅ Document data structured successfully');

        // Log highlight markers if available
        if (citation.highlight_markers && citation.highlight_markers.length > 0) {
          console.log('📍 Highlight markers received:', {
            count: citation.highlight_markers.length,
            markers: citation.highlight_markers
          });
        } else {
          console.warn('⚠️ No highlight markers provided');
        }

      } catch (err) {
        console.error('❌ Error loading document:', err);
        setError(err.message || 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [citation, isOpen, currentRegion]);

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
    
    const pageExists = documentData.pages.find(p => String(p.number) === String(pageNumber));
    if (pageExists) {
      setCurrentPage(pageNumber);
    }
  };

  if (!isOpen) return null;

  const pageNumbers = documentData?.pages.map(p => String(p.number)) || [];
  const currentIndex = pageNumbers.indexOf(String(currentPage));
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < pageNumbers.length - 1;

  return (
    <div className={styles.documentViewer}>
      <DocumentHeader
        title={citation?.document || 'Document'}
        page={currentPage}
        totalPages={documentData?.totalPages}
        onClose={onClose}
      />

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
                highlights={citation?.highlight_markers || []} // Pass highlight markers from citation
                onPageRendered={(pageNum) => console.log(`✅ Page ${pageNum} rendered`)}
                onError={(error) => console.error(`❌ Page ${currentPage} error:`, error)}
              />
            </div>
          </div>
        )}

        {!isLoading && !error && !documentData && (
          <div className={styles.emptyState}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.emptyIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Click on a citation to view the document</p>
          </div>
        )}
      </div>
    </div>
  );
}