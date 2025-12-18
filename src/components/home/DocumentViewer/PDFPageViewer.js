// ============================================================================
// PDFPageViewer.js - PURE CDN VERSION (No npm package)
// ============================================================================
// Location: src/components/home/DocumentViewer/PDFPageViewer.js
// Uses CDN to completely avoid Next.js module resolution issues
// ============================================================================

'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './DocumentViewer.module.css';

/**
 * PDFPageViewer Component - Pure CDN Version
 * Loads PDF.js directly from CDN to avoid Next.js/npm conflicts
 */
export default function PDFPageViewer({ 
  pdfUrl, 
  pageNumber, 
  highlights = [],
  onPageRendered,
  onError 
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [renderError, setRenderError] = useState(null);
  const [pdfLib, setPdfLib] = useState(null);
  const [loadingStep, setLoadingStep] = useState('Initializing...');
  const pdfDocRef = useRef(null);

  // Load PDF.js from CDN (client-side only)
  useEffect(() => {
    let isMounted = true;

    const loadPdfJs = async () => {
      try {
        setLoadingStep('Loading PDF library...');
        console.log('🔧 Loading PDF.js from CDN...');

        // Check if already loaded
        if (window.pdfjsLib) {
          console.log('✅ PDF.js already loaded');
          if (isMounted) {
            setPdfLib(window.pdfjsLib);
            setLoadingStep('Library ready');
          }
          return;
        }

        // Load PDF.js script
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
          document.head.appendChild(script);
        });

        console.log('✅ PDF.js script loaded');

        // Wait for pdfjsLib to be available
        let attempts = 0;
        while (!window.pdfjsLib && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!window.pdfjsLib) {
          throw new Error('PDF.js library not available after loading script');
        }

        const pdfjsLib = window.pdfjsLib;
        console.log('✅ PDF.js version:', pdfjsLib.version);

        // Configure worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        console.log('✅ PDF.js worker configured');

        if (isMounted) {
          setPdfLib(pdfjsLib);
          setLoadingStep('Library loaded');
        }

      } catch (error) {
        console.error('❌ Failed to load PDF.js:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        if (isMounted) {
          setRenderError(`Failed to load PDF library: ${error.message}`);
          setLoadingStep('Failed to load library');
          if (onError) onError(error);
        }
      }
    };

    loadPdfJs();

    return () => {
      isMounted = false;
    };
  }, [onError]);

  // Render PDF page when library is loaded
  useEffect(() => {
    if (!pdfLib || !pdfUrl || !pageNumber) return;

    let isMounted = true;

    const renderPage = async () => {
      try {
        setIsLoading(true);
        setRenderError(null);
        setLoadingStep('Downloading PDF...');

        console.log('📄 Loading PDF document:', pdfUrl);

        // Load PDF document
        if (!pdfDocRef.current) {
          const loadingTask = pdfLib.getDocument(pdfUrl);
          
          // Track download progress
          loadingTask.onProgress = (progress) => {
            if (progress.total > 0) {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              setLoadingStep(`Downloading PDF: ${percent}%`);
              console.log(`📥 Download progress: ${percent}%`);
            }
          };

          pdfDocRef.current = await loadingTask.promise;
          console.log('✅ PDF document loaded');
        }

        const pdf = pdfDocRef.current;
        
        setLoadingStep(`Rendering page ${pageNumber}...`);
        console.log(`🎨 Rendering page ${pageNumber}`);
        
        // Get specific page
        const page = await pdf.getPage(pageNumber);
        
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) {
          console.error('❌ Canvas element not found');
          return;
        }

        const context = canvas.getContext('2d');
        
        // Calculate scale for proper rendering
        const viewport = page.getViewport({ scale: 1.5 });
        
        console.log('📐 Viewport calculated:', {
          width: viewport.width,
          height: viewport.height,
          scale: viewport.scale
        });
        
        // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        setLoadingStep('Rendering page...');
        await page.render(renderContext).promise;

        console.log(`✅ Page ${pageNumber} rendered successfully`);

        // Draw highlights on top of PDF (if any)
        if (highlights && highlights.length > 0) {
          drawHighlights(context, highlights, viewport);
          console.log(`✨ Drew ${highlights.length} highlights`);
        }

        if (isMounted) {
          setIsLoading(false);
          setLoadingStep('');
          if (onPageRendered) {
            onPageRendered(pageNumber);
          }
        }

      } catch (error) {
        console.error('❌ PDF rendering error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          pdfUrl,
          pageNumber
        });
        
        if (isMounted) {
          setIsLoading(false);
          setRenderError(error.message);
          setLoadingStep('');
          if (onError) {
            onError(error);
          }
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [pdfLib, pdfUrl, pageNumber, highlights, onPageRendered, onError]);

  /**
   * Draw highlight rectangles on the canvas
   */
  const drawHighlights = (context, highlights, viewport) => {
    highlights.forEach(highlight => {
      context.save();
      
      // Semi-transparent yellow highlight
      context.fillStyle = 'rgba(255, 235, 59, 0.4)';
      
      // Draw highlight rectangle
      context.fillRect(
        highlight.x * viewport.scale,
        highlight.y * viewport.scale,
        highlight.width * viewport.scale,
        highlight.height * viewport.scale
      );
      
      // Add highlight border
      context.strokeStyle = 'rgba(255, 235, 59, 0.6)';
      context.lineWidth = 2;
      context.strokeRect(
        highlight.x * viewport.scale,
        highlight.y * viewport.scale,
        highlight.width * viewport.scale,
        highlight.height * viewport.scale
      );
      
      context.restore();
    });
  };

  // Loading state
  if (!pdfLib) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <span className={styles.pageNumber}>Page {pageNumber}</span>
        </div>
        <div className={styles.pageContent} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '400px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className={styles.spinner}></div>
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>
              {loadingStep || 'Loading PDF library...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (renderError) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <span className={styles.pageNumber}>Page {pageNumber}</span>
        </div>
        <div className={styles.pageContent} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '400px',
          flexDirection: 'column',
          padding: '2rem'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <p style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '1.125rem' }}>
              Failed to render PDF page
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              {renderError}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal render
  return (
    <div className={styles.pageContainer} ref={containerRef}>
      <div className={styles.pageHeader}>
        <span className={styles.pageNumber}>
          Page {pageNumber}
          {highlights && highlights.length > 0 && (
            <span className={styles.highlightIndicator} title="Contains AI-used content">
              ✨
            </span>
          )}
        </span>
      </div>
      <div className={styles.pageContent} style={{ 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '2rem',
        backgroundColor: '#ffffff',
        position: 'relative'
      }}>
        {isLoading && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 10
          }}>
            <div className={styles.spinner}></div>
            <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
              {loadingStep}
            </p>
          </div>
        )}
        <canvas 
          ref={canvasRef} 
          style={{ 
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            opacity: isLoading ? 0.3 : 1,
            transition: 'opacity 0.3s ease',
            boxShadow: isLoading ? 'none' : '0 4px 6px rgba(0,0,0,0.1)'
          }}
        />
      </div>
    </div>
  );
}