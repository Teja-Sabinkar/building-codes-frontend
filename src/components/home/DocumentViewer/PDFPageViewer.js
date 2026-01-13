// ============================================================================
// PDFPageViewer.js - REACT-PDF WITH FIXED NATIVE HIGHLIGHTING
// ============================================================================
// Location: src/components/home/DocumentViewer/PDFPageViewer.js
// 
// Uses react-pdf for rendering, adds PDF.js native highlighting with fixes for:
// 1. Text normalization (handles punctuation, commas, hyphens)
// 2. Proper highlight positioning and visibility
// ============================================================================

'use client';

import { useEffect, useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './pdf.css';
import styles from './DocumentViewer.module.css';

// Configure PDF.js worker
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  console.log('📦 PDF.js worker configured:', pdfjs.version);
}

export default function PDFPageViewer({
  pdfUrl,
  pageNumber = 1,
  highlightMarkers = [],
  onPageRendered,
  onError
}) {
  const [numPages, setNumPages] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageWidth, setPageWidth] = useState(null);
  const [renderError, setRenderError] = useState(null);
  const containerRef = useRef(null);

  // Calculate page width based on container
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // Use full container width minus small margin
        const calculatedWidth = Math.max(containerWidth - 40, 600);
        console.log(`📐 Container width: ${containerWidth}, Setting pageWidth: ${calculatedWidth}`);
        setPageWidth(calculatedWidth);
      }
    };

    // Add small delay to ensure container is rendered
    const timer = setTimeout(updateWidth, 100);
    window.addEventListener('resize', updateWidth);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log(`✅ PDF loaded: ${numPages} pages`);
    setNumPages(numPages);
    setIsLoading(false);
    setRenderError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('❌ Error loading PDF:', error);
    setRenderError(error.message);
    setIsLoading(false);
    if (onError) onError(error);
  };

  const onPageLoadSuccess = async (page) => {
    console.log(`✅ Page ${pageNumber} rendered`);
    
    // Apply highlights after page loads
    if (highlightMarkers && highlightMarkers.length > 0) {
      // Small delay to ensure text layer is rendered
      setTimeout(() => {
        applyHighlights(page);
      }, 300); // Increased delay
    }

    if (onPageRendered) onPageRendered(pageNumber);
  };

  // Normalize text for matching (remove punctuation, lowercase, handle special cases)
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .replace(/[,.\-–—':;!?()"']/g, '') // Remove punctuation entirely (like backend)
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
  };

  const applyHighlights = async (page) => {
    try {
      console.log(`🎯 Applying ${highlightMarkers.length} highlights using PDF.js`);

      // CRITICAL: Citation page number = chunk number directly
      const targetPageNumber = pageNumberRef.current;
      console.log(`🔍 Looking for page element with data-page-number=${targetPageNumber}`);

      // Find the react-pdf page element
      const pageElements = document.querySelectorAll('.react-pdf__Page');
      const pageElement = Array.from(pageElements).find(el => {
        const dataPageNumber = el.getAttribute('data-page-number');
        return dataPageNumber && parseInt(dataPageNumber) === targetPageNumber;
      });

      if (!pageElement) {
        console.error(`❌ Could not find page element with data-page-number=${targetPageNumber}`);
        return;
      }

      // Find or create highlight layer
      let highlightLayer = pageElement.querySelector('.pdf-highlight-layer');
      if (!highlightLayer) {
        highlightLayer = document.createElement('div');
        highlightLayer.className = 'pdf-highlight-layer';
        highlightLayer.style.position = 'absolute';
        highlightLayer.style.left = '0';
        highlightLayer.style.top = '0';
        highlightLayer.style.right = '0';
        highlightLayer.style.bottom = '0';
        highlightLayer.style.pointerEvents = 'none';
        highlightLayer.style.zIndex = '1';
        pageElement.style.position = 'relative'; // Ensure page is positioned
        pageElement.appendChild(highlightLayer);
      }
      highlightLayer.innerHTML = '';

      // Get text content and viewport
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.5 });

      console.log(`\n🔍 ========== HIGHLIGHTING WITH IMPROVED TEXT MATCHING ==========`);
      console.log(`📊 ${textContent.items.length} text items in PDF`);
      console.log(`📊 ${highlightMarkers.length} markers to process`);

      // Wait for text layer to be fully rendered
      const textLayer = pageElement.querySelector('.textLayer');
      if (!textLayer) {
        console.error('❌ Text layer not found');
        return;
      }
      
      // Wait for spans to be rendered in the text layer
      console.log('⏳ Waiting for text layer spans to render...');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      let successCount = 0;

      for (let markerIndex = 0; markerIndex < highlightMarkers.length; markerIndex++) {
        const marker = highlightMarkers[markerIndex];
        console.log(`\n[${markerIndex + 1}/${highlightMarkers.length}] Processing marker...`);
        console.log(`🔍 Start phrase: "${marker.start_phrase}"`);

        const result = highlightWithTextItems(
          textContent.items,
          marker.word_pairs,
          marker.start_phrase,
          marker.original_text,
          highlightLayer,
          viewport,
          pageElement
        );

        if (result.success) {
          successCount++;
          console.log(`✅ Successfully highlighted!`);
        } else {
          console.log(`❌ Failed to highlight`);
        }
      }

      console.log(`\n📊 FINAL: ${successCount}/${highlightMarkers.length} successful`);
      console.log(`========== COMPLETE ==========\n`);

    } catch (error) {
      console.error('❌ Error applying highlights:', error);
    }
  };

  // Helper function to highlight using PDF.js text items with improved matching
  const highlightWithTextItems = (textItems, wordPairs, startPhrase, originalText, highlightLayer, viewport, pageElement) => {
    try {
      // Normalize the start phrase
      const normalizedStartPhrase = normalizeText(startPhrase);
      const startWords = normalizedStartPhrase.split(/\s+/).filter(w => w);
      
      console.log(`🔍 Normalized start: "${normalizedStartPhrase}"`);
      console.log(`🔍 Start words: [${startWords.join(', ')}]`);

      // Build normalized word array with item indices
      const words = [];
      const wordToItemMap = new Map();

      textItems.forEach((item, itemIndex) => {
        const text = item.str.trim();
        if (!text) return;

        // Normalize the text before splitting
        const normalizedText = normalizeText(text);
        const itemWords = normalizedText.split(/\s+/).filter(w => w);
        
        itemWords.forEach(word => {
          const wordIndex = words.length;
          words.push(word);
          wordToItemMap.set(wordIndex, itemIndex);
        });
      });

      console.log(`📊 Built ${words.length} normalized words from ${textItems.length} items`);

      // Find start phrase in normalized text
      let startIndex = -1;
      for (let i = 0; i <= words.length - startWords.length; i++) {
        let match = true;
        for (let j = 0; j < startWords.length; j++) {
          if (words[i + j] !== startWords[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          startIndex = i;
          break;
        }
      }

      if (startIndex === -1) {
        console.log(`⚠️  Exact match failed, trying fuzzy match (allowing up to 5 skipped words)...`);
        
        // Try fuzzy match - allow skipping up to 5 words
        for (let i = 0; i <= words.length - startWords.length; i++) {
          let matchedWords = 0;
          let skippedWords = 0;
          let k = i;
          
          for (let j = 0; j < startWords.length && k < words.length; k++) {
            if (words[k] === startWords[j]) {
              matchedWords++;
              j++;
            } else {
              skippedWords++;
              if (skippedWords > 5) break; // Max 5 skips
            }
          }
          
          // If we matched all start words with max 5 skips
          if (matchedWords === startWords.length && skippedWords <= 5) {
            startIndex = i;
            console.log(`✅ Found fuzzy match at word index ${startIndex} (skipped ${skippedWords} words)`);
            break;
          }
        }
      }

      // 🔥 NEW: Try compound word matching if fuzzy match failed
      // This handles cases where PDF has "zeroenergy" but we're searching for "zero energy"
      if (startIndex === -1) {
        console.log(`⚠️  Standard matching failed, trying compound word fallback...`);
        
        // 🔥 SMART STRATEGY: Try ALL possible compound combinations
        // PRIORITIZE middle combinations (more likely to be correct)
        // For [nearly, zero, energy, building], try in order:
        // 1. [nearly, zeroenergy, building]  ← PRIORITY (middle compounds)
        // 2. [nearly, zero, energybuilding]  ← second priority
        // 3. [nearlyzero, energy, building]  ← last priority (edge compounds)
        
        const compoundAttempts = [];
        
        // Generate all possible single-compound combinations
        for (let compoundPos = 0; compoundPos < startWords.length - 1; compoundPos++) {
          const attempt = [];
          
          for (let i = 0; i < startWords.length; i++) {
            if (i === compoundPos) {
              // Join this word with the next
              const word1 = startWords[i];
              const word2 = startWords[i + 1];
              
              // Only try if both words are short enough (2-7 chars)
              if (word1.length >= 2 && word1.length <= 7 && 
                  word2.length >= 2 && word2.length <= 7) {
                const compound = word1 + word2;
                attempt.push(compound);
                i++; // Skip next word since we combined it
              } else {
                attempt.push(word1);
              }
            } else if (i === compoundPos + 1) {
              // Skip - already combined with previous
              continue;
            } else {
              attempt.push(startWords[i]);
            }
          }
          
          if (attempt.length > 0 && attempt.length < startWords.length) {
            // Calculate priority: middle positions are more likely correct
            // For 4 words [0,1,2,3], position 1 is best, then 0, then 2
            const middlePos = Math.floor(startWords.length / 2) - 1;
            const distanceFromMiddle = Math.abs(compoundPos - middlePos);
            
            compoundAttempts.push({
              position: compoundPos,
              words: attempt,
              compound: `"${startWords[compoundPos]}" + "${startWords[compoundPos + 1]}"`,
              priority: distanceFromMiddle,
              expectedLength: marker.expected_length || 0
            });
          }
        }
        
        // Sort by priority (lower distance from middle = higher priority)
        compoundAttempts.sort((a, b) => a.priority - b.priority);
        
        console.log(`   Generated ${compoundAttempts.length} compound word attempts (sorted by priority)`);
        
        // Try each compound combination in priority order
        for (const attempt of compoundAttempts) {
          const compoundWords = attempt.words;
          console.log(`   Testing: [${compoundWords.join(', ')}] (${attempt.compound}) [priority: ${attempt.priority}]`);
          
          // Try exact match with this compound combination
          for (let i = 0; i <= words.length - compoundWords.length; i++) {
            let match = true;
            for (let j = 0; j < compoundWords.length; j++) {
              if (words[i + j] !== compoundWords[j]) {
                match = false;
                break;
              }
            }
            if (match) {
              // 🔥 VERIFY: Check if this match has approximately the right length
              // This prevents matching headings when we should match body text
              if (attempt.expectedLength > 0) {
                // Count approximate character length from this position
                let approxLength = 0;
                let wordCount = 0;
                const maxWords = Math.ceil(attempt.expectedLength / 5); // rough estimate: 5 chars per word
                
                for (let k = i; k < words.length && wordCount < maxWords + 5; k++) {
                  approxLength += words[k].length + 1; // +1 for space
                  wordCount++;
                }
                
                const lengthRatio = approxLength / attempt.expectedLength;
                console.log(`      📏 Length check: found ${approxLength} chars, expected ${attempt.expectedLength}, ratio: ${lengthRatio.toFixed(2)}`);
                
                // If we found a very short match but expected long text, keep searching
                if (lengthRatio < 0.3 && i < words.length - compoundWords.length - 10) {
                  console.log(`      ⚠️  Match too short (ratio ${lengthRatio.toFixed(2)}), continuing search...`);
                  continue; // Keep looking
                }
              }
              
              startIndex = i;
              console.log(`✅ Found compound word match at word index ${startIndex} using ${attempt.compound}`);
              break;
            }
          }
          
          if (startIndex !== -1) {
            break; // Found a match, stop trying
          }
        }
      }

      if (startIndex === -1) {
        console.log(`❌ Could not find normalized start phrase (tried exact, fuzzy, and compound matching)`);
        console.log(`📋 Searching for: "${normalizedStartPhrase}"`);
        console.log(`📋 Total words on page: ${words.length}`);
        console.log(`📋 First 200 words of page: ${words.slice(0, 200).join(' ')}`);
        
        // Search for partial matches to help debug
        const searchWords = startWords.join(' ');
        console.log(`🔍 Checking if any part of "${searchWords}" exists in text...`);
        const fullText = words.join(' ');
        if (fullText.includes(startWords[0])) {
          console.log(`   ✓ Found "${startWords[0]}" somewhere in the text`);
        }
        if (fullText.includes(startWords.slice(0, 2).join(' '))) {
          console.log(`   ✓ Found "${startWords.slice(0, 2).join(' ')}" somewhere in the text`);
        }
        
        return { success: false };
      }

      console.log(`✅ Found start at word index ${startIndex}`);

      // Calculate how many words are in the original text
      const originalWords = normalizeText(originalText).split(/\s+/).filter(w => w);
      const phraseLength = originalWords.length;
      console.log(`📏 Original text has ${phraseLength} words, will highlight from index ${startIndex} to ${startIndex + phraseLength - 1}`);

      // Collect all text items that contain words in this range
      const matchedIndices = new Set();
      for (let wordIdx = startIndex; wordIdx < startIndex + phraseLength && wordIdx < words.length; wordIdx++) {
        const itemIndex = wordToItemMap.get(wordIdx);
        if (itemIndex !== undefined) {
          matchedIndices.add(itemIndex);
        }
      }

      console.log(`✅ Matched ${phraseLength} words across ${matchedIndices.size} text items`);
      
      // Debug: Show which text items we matched and their content
      console.log(`📋 Matched text items:`);
      Array.from(matchedIndices).sort((a, b) => a - b).forEach(idx => {
        const item = textItems[idx];
        console.log(`  Item ${idx}: "${item.str}" at y=${item.transform[5]}`);
      });

      if (matchedIndices.size === 0) {
        console.log(`❌ No items matched`);
        return { success: false };
      }

      // Create highlights based on actual span positions
      console.log(`🎨 Creating yellow highlights for ${matchedIndices.size} text items`);
      
      const textLayer = pageElement.querySelector('.react-pdf__Page__textContent');
      if (!textLayer) {
        console.error('❌ Text layer not found');
        return { success: false };
      }

      const spans = textLayer.querySelectorAll('span');
      console.log(`📊 Found ${spans.length} spans in DOM`);
      
      matchedIndices.forEach(itemIndex => {
        const item = textItems[itemIndex];
        const itemText = item.str.trim();
        
        console.log(`\n🔍 Looking for span matching item ${itemIndex}: "${itemText.substring(0, 30)}..."`);
        
        // Find ALL spans that match this text item's content
        const candidateSpans = [];
        for (let i = 0; i < spans.length; i++) {
          const spanText = spans[i].textContent.trim();
          
          if (spanText === itemText) {
            candidateSpans.push({ span: spans[i], index: i });
          }
        }
        
        if (candidateSpans.length === 0) {
          console.log(`  ⚠️  No exact match found. Trying normalized comparison...`);
          // Try normalized comparison as fallback
          const normalizedItemText = normalizeText(itemText);
          for (let i = 0; i < spans.length; i++) {
            const normalizedSpanText = normalizeText(spans[i].textContent.trim());
            if (normalizedSpanText === normalizedItemText) {
              candidateSpans.push({ span: spans[i], index: i });
            }
          }
        }
        
        if (candidateSpans.length === 0) {
          console.log(`  ❌ Could not find span for item ${itemIndex}: "${itemText}"`);
          return;
        }
        
        // If multiple candidates, pick the one closest in y-position
        let matchedSpan;
        let matchedSpanIndex;
        
        if (candidateSpans.length === 1) {
          matchedSpan = candidateSpans[0].span;
          matchedSpanIndex = candidateSpans[0].index;
          console.log(`  ✅ Found exact match at span index ${matchedSpanIndex}`);
        } else {
          console.log(`  ⚠️  Found ${candidateSpans.length} duplicate matches, picking closest by y-position...`);
          console.log(`  📍 Target item y-position: ${item.transform[5].toFixed(2)}`);
          
          // Pick span with closest y-position
          let closestCandidate = candidateSpans[0];
          let smallestDistance = Infinity;
          
          candidateSpans.forEach((candidate, idx) => {
            const rect = candidate.span.getBoundingClientRect();
            const textLayerRect = textLayer.getBoundingClientRect();
            
            // Convert screen coordinates back to PDF coordinates (approximate)
            const spanY = rect.top - textLayerRect.top;
            const itemY = item.transform[5];
            const distance = Math.abs(spanY - itemY);
            
            console.log(`    Candidate ${idx} (span ${candidate.index}): spanY=${spanY.toFixed(2)}, distance=${distance.toFixed(2)}`);
            
            if (distance < smallestDistance) {
              smallestDistance = distance;
              closestCandidate = candidate;
            }
          });
          
          matchedSpan = closestCandidate.span;
          matchedSpanIndex = closestCandidate.index;
          console.log(`  ✅ Picked span ${matchedSpanIndex} (closest match with distance ${smallestDistance.toFixed(2)})`);
        }
        
        const rect = matchedSpan.getBoundingClientRect();
        
        console.log(`  📐 Span ${matchedSpanIndex} rect: left=${rect.left.toFixed(2)}, top=${rect.top.toFixed(2)}, w=${rect.width.toFixed(2)}, h=${rect.height.toFixed(2)}`);
        
        // Skip invisible spans (width or height = 0)
        if (rect.width === 0 || rect.height === 0) {
          console.log(`  ⏭️  Skipping item ${itemIndex}: invisible (w=${rect.width}, h=${rect.height})`);
          return;
        }
        
        const textLayerRect = textLayer.getBoundingClientRect();
        console.log(`  📐 Text layer rect: left=${textLayerRect.left.toFixed(2)}, top=${textLayerRect.top.toFixed(2)}`);
        
        // Calculate position relative to text layer
        const left = rect.left - textLayerRect.left;
        const top = rect.top - textLayerRect.top;
        
        console.log(`  📍 Relative position: left=${left.toFixed(2)}, top=${top.toFixed(2)}`);
        
        const highlight = document.createElement('div');
        highlight.style.position = 'absolute';
        highlight.style.left = `${left}px`;
        highlight.style.top = `${top}px`;
        highlight.style.width = `${rect.width}px`;
        highlight.style.height = `${rect.height}px`;
        highlight.style.backgroundColor = 'rgba(255, 255, 0, 0.4)';
        highlight.style.pointerEvents = 'none';
        highlight.style.mixBlendMode = 'multiply';
        
        console.log(`  🎨 Highlight ${itemIndex}: "${item.str.substring(0, 30)}..." at left=${left.toFixed(2)}px, top=${top.toFixed(2)}px, w=${rect.width.toFixed(2)}px, h=${rect.height.toFixed(2)}px`);
        
        highlightLayer.appendChild(highlight);
      });

      return { success: true, matchCount: matchedIndices.size };

    } catch (error) {
      console.error('❌ Error in highlightWithTextItems:', error);
      return { success: false };
    }
  };

  // Render
  console.log(`🔍 PDFPageViewer render: pageWidth=${pageWidth}, isLoading=${isLoading}, page=${pageNumber}`);
  
  // CRITICAL: Citation "Page X" refers to chunk X
  // Chunk X contains printed page X-1 on the PDF
  // So we use pageNumber directly as the chunk number
  console.log(`📄 Citation Page ${pageNumber} → Chunk ${pageNumber} (printed page ${pageNumber - 1})`);
  
  // Store page number in ref so applyHighlights can access it
  const pageNumberRef = useRef(pageNumber);
  useEffect(() => {
    pageNumberRef.current = pageNumber;
  }, [pageNumber]);
  
  // Use calculated width or fallback to a reasonable default (A4 width at 96 DPI)
  const displayWidth = pageWidth || 794;

  return (
    <div ref={containerRef} className={styles.pdfContainer}>
      {renderError && (
        <div className={styles.errorState}>
          <p>Error loading PDF: {renderError}</p>
        </div>
      )}
      
      {!renderError && (
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading PDF...</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            width={displayWidth}
            onLoadSuccess={onPageLoadSuccess}
            onLoadError={(error) => {
              console.error(`❌ Page ${pageNumber} load error:`, error);
              if (onError) onError(error);
            }}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      )}
    </div>
  );
}