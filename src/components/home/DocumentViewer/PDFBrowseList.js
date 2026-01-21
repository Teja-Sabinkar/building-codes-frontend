// src/components/home/DocumentViewer/PDFBrowseList.js
// PDF Browse List Component - Interactive document browser with search and categories
'use client';

import { useState, useMemo } from 'react';
import { DOCUMENT_CATEGORIES } from '@/lib/documentMappings';
import styles from './PDFBrowseList.module.css';

export default function PDFBrowseList({ 
  region,              // 'India' | 'Scotland' | 'Dubai'
  onDocumentSelect,    // Handler for document click
  onClose,             // Handler for close button
  isMobile = false     // Mobile detection flag
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(() => {
    // All categories expanded by default
    const regionData = DOCUMENT_CATEGORIES[region];
    if (!regionData) return {};
    
    return regionData.categories.reduce((acc, category) => {
      acc[category.name] = true;
      return acc;
    }, {});
  });

  // Get region data
  const regionData = DOCUMENT_CATEGORIES[region];

  // Filter documents based on search
  const filteredCategories = useMemo(() => {
    if (!regionData) return [];
    
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) {
      // No search - return all categories
      return regionData.categories;
    }
    
    // Search - filter documents within categories
    return regionData.categories
      .map(category => ({
        ...category,
        documents: category.documents.filter(doc =>
          doc.displayName.toLowerCase().includes(query) ||
          doc.documentName.toLowerCase().includes(query)
        )
      }))
      .filter(category => category.documents.length > 0);
  }, [regionData, searchQuery]);

  // Toggle category expand/collapse
  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Handle document click
  const handleDocumentClick = (document, category) => {
    console.log('📄 Document selected:', {
      displayName: document.displayName,
      documentName: document.documentName,
      category: category.name,
      region
    });

    onDocumentSelect({
      documentName: document.documentName,
      pdfFilename: document.pdfFilename,
      country: region,
      displayName: document.displayName,
      category: category.name
    });
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  if (!regionData) {
    return (
      <div className={styles.browseContainer}>
        <div className={styles.errorMessage}>
          ⚠️ No documents available for region: {region}
        </div>
      </div>
    );
  }

  const totalDocuments = regionData.categories.reduce(
    (sum, cat) => sum + cat.documents.length, 
    0
  );

  const filteredDocumentCount = filteredCategories.reduce(
    (sum, cat) => sum + cat.documents.length,
    0
  );

  return (
    <div className={`${styles.browseContainer} ${isMobile ? styles.mobileFullscreen : ''}`}>
      {/* Header */}
      <div className={styles.browseHeader}>
        <div className={styles.headerTop}>
          <h3 className={styles.browseTitle}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={styles.titleIcon} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
              />
            </svg>
            {region} Building Codes
          </h3>
          
          <button
            onClick={onClose}
            className={styles.closeButton}
            title="Close"
            aria-label="Close document browser"
          >
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

        <p className={styles.browseSubtitle}>
          {searchQuery ? `${filteredDocumentCount} of ${totalDocuments}` : totalDocuments} documents available
        </p>

        {/* Search Bar */}
        <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={styles.searchIcon} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className={styles.searchInput}
              autoFocus={!isMobile}
            />
            
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className={styles.clearButton}
                title="Clear search"
                aria-label="Clear search"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={styles.clearIcon} 
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
            )}
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className={styles.categoriesContainer}>
        {filteredCategories.length === 0 ? (
          <div className={styles.noResults}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={styles.noResultsIcon} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <p className={styles.noResultsText}>No documents found</p>
            <p className={styles.noResultsSubtext}>Try a different search term</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.name} className={styles.categorySection}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.name)}
                className={styles.categoryHeader}
                aria-expanded={expandedCategories[category.name]}
              >
                <div className={styles.categoryTitleRow}>
                  <h4 className={styles.categoryTitle}>{category.name}</h4>
                  <span className={styles.documentCount}>
                    {category.documents.length}
                  </span>
                </div>
                
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`${styles.expandIcon} ${expandedCategories[category.name] ? styles.expanded : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 9l-7 7-7-7" 
                  />
                </svg>
              </button>

              {/* Documents List */}
              {expandedCategories[category.name] && (
                <div className={styles.documentsGrid}>
                  {category.documents.map((document) => (
                    <button
                      key={document.documentName}
                      onClick={() => handleDocumentClick(document, category)}
                      className={styles.documentCard}
                      title={`Open ${document.displayName}`}
                    >
                      <div className={styles.documentIconWrapper}>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={styles.documentIcon} 
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
                      
                      <div className={styles.documentInfo}>
                        <p className={styles.documentName}>{document.displayName}</p>
                        <span className={styles.documentType}>
                          {document.pageCount ? `${document.pageCount} pages` : 'PDF Document'}
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
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}