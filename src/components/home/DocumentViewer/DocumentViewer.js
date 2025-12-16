// src/components/home/DocumentViewer/DocumentViewer.js
// COMPLETE REPLACEMENT - Smart Marker-Based Highlighting
// Version: 2.0 with highlighting support

'use client';

import { useState, useEffect, useRef } from 'react';
import DocumentHeader from './DocumentHeader';
import PageNavigation from './PageNavigation';
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
  const [highlightedSections, setHighlightedSections] = useState([]);
  const [highlightStats, setHighlightStats] = useState({ attempted: 0, successful: 0, failed: 0 });
  
  const documentContentRef = useRef(null);
  const pageRefs = useRef({});

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
        
        console.log('📄 Fetching document chunks:', {
          document: citation.document,
          page: citation.page,
          country: country,
          hasHighlightMarkers: !!citation.highlight_markers
        });

        // Fetch all chunks for the document
        const response = await fetch(
          `/api/document/chunks?document=${encodeURIComponent(citation.document)}&country=${encodeURIComponent(country)}`
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
            markers: citation.highlight_markers.map((m, i) => ({
              index: i,
              start: m.start?.substring(0, 30) + '...',
              end: m.end?.substring(m.end?.length - 30),
              hasPreview: !!m.preview
            }))
          });
        } else {
          console.warn('⚠️ No highlight markers provided in citation');
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

  // Scroll to cited page after document loads (ONE TIME ONLY)
  useEffect(() => {
    if (!documentData || !currentPage || !documentContentRef.current) return;

    const scrollTimer = setTimeout(() => {
      scrollToPage(currentPage);
    }, 300);

    return () => clearTimeout(scrollTimer);
  }, [documentData]); // ✅ Only scroll when document loads, prevents re-scroll

  // Apply highlighting after document loads and citation has markers
  useEffect(() => {
    if (!documentData || !citation || !citation.highlight_markers) return;
    
    const highlightTimer = setTimeout(() => {
      applySmartHighlighting(citation.highlight_markers, citation.page);
    }, 500);

    return () => clearTimeout(highlightTimer);
  }, [documentData, citation]);

  /**
   * Normalize text for reliable matching
   */
  const normalizeText = (text) => {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .replace(/\u00a0/g, ' ')  // Non-breaking space
      .replace(/\u2013/g, '-')  // En dash
      .replace(/\u2014/g, '-')  // Em dash
      .replace(/\u2018/g, "'")  // Left single quote
      .replace(/\u2019/g, "'")  // Right single quote
      .replace(/\u201c/g, '"')  // Left double quote
      .replace(/\u201d/g, '"')  // Right double quote
      .replace(/\s+/g, ' ')      // Multiple spaces to single
      .replace(/[^\w\s.,;:()\-]/g, '')  // Remove special chars
      .trim();
  };

  /**
   * Find text position in content using normalized matching
   */
  const findTextPosition = (content, searchText, startFrom = 0) => {
    const normalizedContent = normalizeText(content);
    const normalizedSearch = normalizeText(searchText);
    
    if (!normalizedSearch) return -1;
    
    const position = normalizedContent.indexOf(normalizedSearch, startFrom);
    
    if (position === -1) {
      console.warn('Text not found:', {
        searchText: searchText.substring(0, 50),
        searchLength: searchText.length,
        contentLength: content.length
      });
    }
    
    return position;
  };

  /**
   * Apply smart highlighting using markers
   */
  const applySmartHighlighting = (markers, targetPage) => {
    if (!markers || markers.length === 0) {
      console.warn('⚠️ No markers provided for highlighting');
      return;
    }

    console.log(`🎨 Starting smart highlighting with ${markers.length} markers on page ${targetPage}`);

    const pageElement = pageRefs.current[targetPage];
    if (!pageElement) {
      console.error('❌ Page element not found for highlighting:', targetPage);
      return;
    }

    const contentElement = pageElement.querySelector('[data-page-content]');
    if (!contentElement) {
      console.error('❌ Content element not found in page');
      return;
    }

    const pageContent = contentElement.textContent;
    let stats = { attempted: 0, successful: 0, failed: 0 };
    const successfulSections = [];

    // Remove any existing highlights
    removeExistingHighlights(contentElement);

    // Process each marker
    markers.forEach((marker, index) => {
      stats.attempted++;
      
      console.log(`\n📍 Processing marker ${index + 1}/${markers.length}:`);
      console.log(`   Start: "${marker.start?.substring(0, 40)}..."`);
      console.log(`   End: "...${marker.end?.substring(marker.end?.length - 40)}"`);

      try {
        const startText = marker.start_normalized || marker.start;
        const endText = marker.end_normalized || marker.end;

        // Find start position
        const startPos = findTextPosition(pageContent, startText);
        if (startPos === -1) {
          console.warn(`   ⚠️ Start marker not found`);
          stats.failed++;
          return;
        }

        // Calculate end position using section_length if available
        let actualEndPos;

        if (marker.section_length && marker.section_length > 0) {
          // Use the full section length from backend
          actualEndPos = startPos + marker.section_length;
          console.log(`   📏 Using section_length: ${marker.section_length} chars`);
          
          // Validate the range
          if (actualEndPos > pageContent.length) {
            actualEndPos = pageContent.length;
            console.warn(`   ⚠️ Clamped end position to content length`);
          }
        } else {
          // Fallback: find end marker
          const endPos = findTextPosition(pageContent, endText, startPos);
          if (endPos === -1) {
            console.warn(`   ⚠️ End marker not found`);
            stats.failed++;
            return;
          }
          actualEndPos = endPos + endText.length;
          console.log(`   📏 Using end marker position`);
        }

        const highlightSuccess = highlightTextRange(
          contentElement, 
          startPos, 
          actualEndPos,
          `section-${index}`
        );

        if (highlightSuccess) {
          stats.successful++;
          successfulSections.push({
            index,
            start: startPos,
            end: actualEndPos,
            length: actualEndPos - startPos
          });
          console.log(`   ✅ Highlighted ${actualEndPos - startPos} characters`);
        } else {
          stats.failed++;
          console.warn(`   ❌ Failed to apply highlight`);
        }

      } catch (error) {
        console.error(`   ❌ Error processing marker ${index}:`, error);
        stats.failed++;
      }
    });

    setHighlightStats(stats);
    setHighlightedSections(successfulSections);

    console.log(`\n📊 Highlighting complete:`, {
      attempted: stats.attempted,
      successful: stats.successful,
      failed: stats.failed,
      successRate: `${((stats.successful / stats.attempted) * 100).toFixed(1)}%`
    });

    if (successfulSections.length > 0) {
      setTimeout(() => {
        const firstHighlight = contentElement.querySelector('.text-highlight');
        if (firstHighlight && documentContentRef.current) {
          // Check if highlight is already visible
          const highlightRect = firstHighlight.getBoundingClientRect();
          const containerRect = documentContentRef.current.getBoundingClientRect();
          
          const isVisible = (
            highlightRect.top >= containerRect.top &&
            highlightRect.bottom <= containerRect.bottom
          );
          
          if (!isVisible) {
            firstHighlight.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            console.log('📜 Scrolled to first highlighted section');
          } else {
            console.log('📍 Highlight already visible, no scroll needed');
          }
        }
      }, 100);
    }

  };

  /**
   * Remove existing highlights from element
   */
  const removeExistingHighlights = (element) => {
    const existingHighlights = element.querySelectorAll('.text-highlight');
    existingHighlights.forEach(highlight => {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    });
  };

  /**
   * Highlight text range using character positions
   */
  const highlightTextRange = (element, startPos, endPos, sectionId) => {
    try {
      const range = document.createRange();
      let currentPos = 0;
      let startNode = null;
      let startOffset = 0;
      let endNode = null;
      let endOffset = 0;
      let found = false;

      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        const nodeLength = node.textContent.length;
        
        if (!startNode && currentPos + nodeLength >= startPos) {
          startNode = node;
          startOffset = startPos - currentPos;
        }
        
        if (!endNode && currentPos + nodeLength >= endPos) {
          endNode = node;
          endOffset = endPos - currentPos;
          found = true;
          break;
        }
        
        currentPos += nodeLength;
      }

      if (!found || !startNode || !endNode) {
        console.warn('Could not find text nodes for range');
        return false;
      }

      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);

      const highlightSpan = document.createElement('span');
      highlightSpan.className = 'text-highlight';
      highlightSpan.setAttribute('data-section-id', sectionId);
      
      try {
        range.surroundContents(highlightSpan);
        return true;
      } catch (e) {
        const fragment = range.extractContents();
        highlightSpan.appendChild(fragment);
        range.insertNode(highlightSpan);
        return true;
      }

    } catch (error) {
      console.error('Error highlighting range:', error);
      return false;
    }
  };

  /**
   * Scroll to specific page
   */
  const scrollToPage = (pageNumber) => {
    const pageElement = pageRefs.current[pageNumber];
    if (pageElement && documentContentRef.current) {
      const containerTop = documentContentRef.current.getBoundingClientRect().top;
      const elementTop = pageElement.getBoundingClientRect().top;
      const scrollPosition = elementTop - containerTop + documentContentRef.current.scrollTop - 20;

      documentContentRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });

      console.log('📜 Scrolled to page:', pageNumber);
    }
  };

  /**
   * Navigate to previous page
   */
  const handlePreviousPage = () => {
    if (!documentData || !currentPage) return;
    
    const pageNumbers = documentData.pages.map(p => String(p.number));
    const currentIndex = pageNumbers.indexOf(String(currentPage));
    
    if (currentIndex > 0) {
      const newPage = pageNumbers[currentIndex - 1];
      setCurrentPage(newPage);
      scrollToPage(newPage);
    }
  };

  /**
   * Navigate to next page
   */
  const handleNextPage = () => {
    if (!documentData || !currentPage) return;
    
    const pageNumbers = documentData.pages.map(p => String(p.number));
    const currentIndex = pageNumbers.indexOf(String(currentPage));
    
    if (currentIndex < pageNumbers.length - 1) {
      const newPage = pageNumbers[currentIndex + 1];
      setCurrentPage(newPage);
      scrollToPage(newPage);
    }
  };

  /**
   * Jump to specific page
   */
  const handleJumpToPage = (pageNumber) => {
    if (!documentData) return;
    
    const pageExists = documentData.pageMap[pageNumber];
    if (pageExists) {
      setCurrentPage(pageNumber);
      scrollToPage(pageNumber);
    } else {
      console.warn('⚠️ Page not found:', pageNumber);
    }
  };

  /**
   * Handle scroll to update current page indicator
   */
  const handleScroll = () => {
    if (!documentContentRef.current || !documentData) return;

    const container = documentContentRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const scrollMiddle = scrollTop + containerHeight / 2;

    let closestPage = null;
    let closestDistance = Infinity;

    Object.keys(pageRefs.current).forEach(pageNumber => {
      const pageElement = pageRefs.current[pageNumber];
      if (pageElement) {
        const pageTop = pageElement.offsetTop;
        const pageHeight = pageElement.offsetHeight;
        const pageMiddle = pageTop + pageHeight / 2;
        const distance = Math.abs(scrollMiddle - pageMiddle);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = pageNumber;
        }
      }
    });

    if (closestPage && closestPage !== currentPage) {
      setCurrentPage(closestPage);
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
        />
      )}

      <div 
        className={styles.documentContent}
        ref={documentContentRef}
        onScroll={handleScroll}
      >
        {isLoading && (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading document...</p>
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

        {!isLoading && !error && documentData && (
          <div className={styles.documentPages}>
            {documentData.pages.map((page) => {
              const hasHighlights = highlightedSections.some(s => 
                pageRefs.current[page.number]?.contains(
                  document.querySelector(`[data-section-id="section-${s.index}"]`)
                )
              );

              return (
                <div 
                  key={page.number} 
                  className={styles.pageContainer}
                  ref={el => pageRefs.current[page.number] = el}
                  data-page-number={page.number}
                >
                  <div className={styles.pageHeader}>
                    <span className={styles.pageNumber}>
                      Page {page.number}
                      {hasHighlights && (
                        <span className={styles.highlightIndicator} title="Contains AI-used content">
                          ✨
                        </span>
                      )}
                    </span>
                    {page.section && (
                      <span className={styles.pageSection}>{page.section}</span>
                    )}
                  </div>
                  <div className={styles.pageContent}>
                    <pre 
                      className={styles.textContent}
                      data-page-content
                      data-page-number={page.number}
                    >
                      {page.content || 'Content not available for this page'}
                    </pre>
                  </div>
                </div>
              );
            })}
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