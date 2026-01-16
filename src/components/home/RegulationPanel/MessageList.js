// src/components/home/RegulationPanel/MessageList.js - Building Codes Assistant
// UPDATED: Tooltip support for hovering over references
'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './MessageList.module.css';
import FeedbackModal from './FeedbackModal';

export default function MessageList({
  messages,
  isGenerating,
  onEditMessage,
  user,
  conversationId,
  currentConversation,
  onCitationClick
}) {
  const messagesEndRef = useRef(null);
  const renderOccurrencesRef = useRef({}); // 🔥 NEW: Track occurrences across entire component
  
  // 🔥 CRITICAL: Reset occurrence counter at the start of EVERY render
  // This ensures each render cycle starts fresh with occurrence-1
  renderOccurrencesRef.current = {};
  
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Feedback state
  const [feedbackState, setFeedbackState] = useState({});
  const [feedbackErrors, setFeedbackErrors] = useState({});

  // Feedback modal state
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    messageId: null,
    feedbackType: null
  });

  // Success message state
  const [successMessage, setSuccessMessage] = useState({
    messageId: null,
    show: false
  });

  // 🆕 Store QUOTED_TEXT for tooltips
  const [referenceTooltips, setReferenceTooltips] = useState({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ADD THIS STATE at the top of MessageList component (after line 41):
  const [loadingPhase, setLoadingPhase] = useState(0);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Initialize feedback state from messages
  useEffect(() => {
    const initialFeedbackState = {};
    messages.forEach((message) => {
      if (message._id && message.feedback) {
        initialFeedbackState[message._id] = {
          userVote: message.feedback.userVote,
          isSubmitting: false
        };
      }
    });
    setFeedbackState(initialFeedbackState);
  }, [messages]);

  // ADD THIS EFFECT after line 63 (with other useEffects):
  // Progressive loading phases
  useEffect(() => {
    if (isGenerating) {
      setLoadingPhase(0);

      // Phase 1 → Phase 2 after 3 seconds
      const timer1 = setTimeout(() => {
        setLoadingPhase(1);
      }, 3000);

      // Phase 2 → Phase 3 after 6 seconds total
      const timer2 = setTimeout(() => {
        setLoadingPhase(2);
      }, 6000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setLoadingPhase(0);
    }
  }, [isGenerating]);

  // 🔥 FIXED: Extract QUOTED_TEXT from RAW content BEFORE cleaning
  useEffect(() => {
    const tooltips = {};
    const referenceOccurrences = {}; // 🔥 NEW: Track occurrences per reference

    messages.forEach((message, messageIndex) => {
      if (message.role === 'assistant' && message.content) {
        // 🔥 USE RAW CONTENT - Don't clean it first!
        const rawContent = message.content;

        console.log(`🔍 Processing message ${messageIndex}...`);
        console.log(`📄 RAW Content (first 300 chars): ${rawContent.substring(0, 300)}...`);
        console.log(`🔍 Contains QUOTED_TEXT? ${rawContent.includes('QUOTED_TEXT')}`);

        // Split content into lines
        const lines = rawContent.split('\n');

        // Look for QUOTED_TEXT followed by Reference
        for (let i = 0; i < lines.length; i++) {
          const currentLine = lines[i].trim();

          // Check if this line contains QUOTED_TEXT
          if (currentLine.includes('QUOTED_TEXT:')) {
            console.log(`📝 Found QUOTED_TEXT at line ${i}: ${currentLine.substring(0, 100)}`);

            // Extract the quoted text (between any type of quotes)
            // 🔥 HANDLE **QUOTED_TEXT:** with bold markers
            const quotePatterns = [
              /\*\*QUOTED_TEXT:\*\*\s*"([^"]*)"/,     // **QUOTED_TEXT:** with standard quotes
              /\*\*QUOTED_TEXT:\*\*\s*"([^"]*)"/,     // **QUOTED_TEXT:** with curly quotes
              /QUOTED_TEXT:\s*"([^"]*)"/,                  // QUOTED_TEXT: without bold
              /QUOTED_TEXT:\s*"([^"]*)"/,                  // QUOTED_TEXT: with curly quotes
              /QUOTED_TEXT:\s*'([^']*)'/,                  // QUOTED_TEXT: with single quotes
            ];

            let quotedText = null;
            for (const pattern of quotePatterns) {
              const match = currentLine.match(pattern);
              if (match) {
                quotedText = match[1].trim();
                console.log(`   ✅ Extracted quote (${quotedText.length} chars): "${quotedText.substring(0, 100)}..."`);
                break;
              }
            }

            if (!quotedText) {
              console.log(`   ❌ Could not extract quote from line`);
              continue;
            }

            // Look for Reference in the next few lines
            for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
              const nextLine = lines[j].trim();

              if (nextLine.includes('Reference:')) {
                console.log(`📍 Found Reference at line ${j}: ${nextLine}`);

                // 🔥 CRITICAL: Extract ONLY "Reference: Document Page X"
                // Remove ** and anything after the page number
                let referenceText = nextLine;

                // Remove leading/trailing **
                referenceText = referenceText.replace(/^\*\*/g, '').replace(/\*\*$/g, '');

                // Extract just "Reference: ... Page NUMBER" (stop at the page number)
                const refMatch = referenceText.match(/(Reference:[^P]*Page\s+\d+)/i);
                if (refMatch) {
                  referenceText = refMatch[1].trim();
                }

                console.log(`   📍 Cleaned reference: "${referenceText}"`);

                // 🔥 NEW: Track occurrence count for this reference
                const baseKey = `${messageIndex}-${referenceText}`;
                if (!referenceOccurrences[baseKey]) {
                  referenceOccurrences[baseKey] = 0;
                }
                referenceOccurrences[baseKey]++;
                
                // Create unique key with occurrence number
                const referenceKey = `${baseKey}-occurrence-${referenceOccurrences[baseKey]}`;
                tooltips[referenceKey] = quotedText;

                console.log(`   ✅ Created tooltip mapping:`);
                console.log(`      Key: "${referenceKey}"`);
                console.log(`      Value: "${quotedText.substring(0, 80)}..."`);
                console.log(`      Occurrence #: ${referenceOccurrences[baseKey]}`);

                break;
              }
            }
          }
        }
      }
    });

    setReferenceTooltips(tooltips);
    
    console.log(`\n✅ EXTRACTION COMPLETE`);
    console.log(`📊 Total tooltips extracted: ${Object.keys(tooltips).length}`);
    console.log(`🔑 Tooltip keys:`, Object.keys(tooltips));

    // Log each tooltip
    Object.entries(tooltips).forEach(([key, value]) => {
      console.log(`\n🎯 Tooltip Mapping:`);
      console.log(`   Key: ${key}`);
      console.log(`   Value: ${value.substring(0, 150)}...`);
    });
  }, [messages]);

  // Handle feedback button click
  const handleFeedbackClick = async (messageId, vote) => {
    if (!conversationId || !messageId) {
      console.error('Missing conversationId or messageId');
      return;
    }

    const currentVote = feedbackState[messageId]?.userVote;
    if (currentVote === vote) {
      console.log('User clicked the same vote - no action needed');
      return;
    }

    console.log('👍 Opening feedback modal:', { messageId, vote, currentVote });

    setFeedbackModal({
      isOpen: true,
      messageId: messageId,
      feedbackType: vote
    });
  };

  // Handle feedback modal submission
  const handleFeedbackSubmit = async (feedbackData) => {
    const { messageId, feedbackType } = feedbackData;

    console.log('📝 Submitting feedback with details:', feedbackData);

    setFeedbackState(prev => ({
      ...prev,
      [messageId]: { userVote: feedbackType, isSubmitting: true }
    }));

    setFeedbackErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[messageId];
      return newErrors;
    });

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/conversations/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId,
          messageId,
          ...feedbackData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      const result = await response.json();
      console.log('✅ Feedback submitted successfully:', result);

      setFeedbackState(prev => ({
        ...prev,
        [messageId]: { userVote: feedbackType, isSubmitting: false }
      }));

      setSuccessMessage({
        messageId,
        show: true
      });

      setTimeout(() => {
        setSuccessMessage({ messageId: null, show: false });
      }, 3000);

      setFeedbackModal({ isOpen: false, messageId: null, feedbackType: null });

    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      setFeedbackErrors(prev => ({
        ...prev,
        [messageId]: error.message || 'Failed to submit feedback'
      }));
      setFeedbackState(prev => ({
        ...prev,
        [messageId]: { userVote: null, isSubmitting: false }
      }));
    }
  };

  const handleFeedbackCancel = () => {
    setFeedbackModal({ isOpen: false, messageId: null, feedbackType: null });
  };

  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    // Hours old (less than 24 hours) - show time only: "02:30pm"
    if (diffInSeconds < 86400) {
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      
      // Convert to 12-hour format
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      
      const minutesStr = minutes.toString().padStart(2, '0');
      return `${hours.toString().padStart(2, '0')}:${minutesStr}${ampm}`;
    }
    
    // Days/months/years old - show date: "16 jan 2026" or "16 jan"
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    // Same year - no year suffix: "16 jan"
    if (year === now.getFullYear()) {
      return `${day} ${month}`;
    }
    
    // Different year - include year: "16 jan 2026"
    return `${day} ${month} ${year}`;
  };

  const handleStartEdit = (messageIndex) => {
    setEditingMessageIndex(messageIndex);
    setEditContent(messages[messageIndex].content);
  };

  const handleCancelEdit = () => {
    setEditingMessageIndex(null);
    setEditContent('');
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() && editingMessageIndex !== null) {
      setIsEditing(true);
      await onEditMessage(editingMessageIndex, editContent.trim());
      setIsEditing(false);
      setEditingMessageIndex(null);
      setEditContent('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Clean content - remove QUOTED_TEXT lines and asterisks
  const cleanMessageContent = (content) => {
    if (!content) return '';

    let processedContent = content;

    // Remove Citation: lines
    processedContent = processedContent.replace(/^Citation:.*$/gmi, '');

    // Remove QUOTED_TEXT lines (all formats)
    processedContent = processedContent.replace(/QUOTED_TEXT:\s*[""'].*?[""']/g, '');
    processedContent = processedContent.replace(/^QUOTED_TEXT:.*$/gm, '');
    processedContent = processedContent.replace(/QUOTED_TEXT:[^\n]*/g, '');

    // Remove standalone ** lines (left after QUOTED_TEXT removal)
    processedContent = processedContent.replace(/^\*\*\s*$/gm, '');

    // Remove lines that are ONLY asterisks and whitespace
    processedContent = processedContent.replace(/^[\*\s]+$/gm, '');

    // Remove ** that appear on their own line
    processedContent = processedContent.replace(/\n\*\*\n/g, '\n');

    // Remove multiple consecutive ** on same line
    processedContent = processedContent.replace(/\*\*\s*\*\*/g, '');

    // Clean up extra whitespace and newlines
    processedContent = processedContent
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .replace(/^\s*\n+/g, '')
      .replace(/\n+\s*$/g, '')
      .trim();

    return processedContent;
  };

  // Handle citation click to open document viewer
  const handleCitationClick = (ref) => {
    if (onCitationClick) {
      console.log('📄 Citation clicked - FULL OBJECT:', JSON.stringify(ref, null, 2));
      console.log('📄 Has highlight_markers?', ref.highlight_markers ? 'YES' : 'NO');
      if (ref.highlight_markers) {
        console.log('📄 highlight_markers count:', ref.highlight_markers.length);
      }

      onCitationClick({
        document: ref.document,
        page: ref.page,
        country: ref.country,
        source: ref.source,
        highlight_markers: ref.highlight_markers
      });
    }
  };

  // Extract references from message content as fallback
  const extractReferencesFromContent = (messageContent) => {
    if (!messageContent) return [];

    console.log('📋 Extracting references from content...');

    const referencePatterns = [
      /Reference:\s*([^\n]+)/gi,
    ];

    const foundReferences = [];

    for (const pattern of referencePatterns) {
      let match;
      while ((match = pattern.exec(messageContent)) !== null) {
        const referenceText = match[1].trim();
        console.log('📋 Found reference text:', referenceText);

        const pageMatch = referenceText.match(/^(.+?)\s+Page\s+(\d+)$/i);
        if (pageMatch) {
          const document = pageMatch[1].trim();
          const page = pageMatch[2];

          const country = currentConversation?.region || "Scotland";

          foundReferences.push({
            document: document,
            page: page,
            display_text: `${document} Page ${page}`,
            country: country
          });

          console.log('✅ Extracted reference:', `${document} Page ${page} (${country})`);
        }
      }
    }

    const uniqueReferences = foundReferences.filter((ref, index, self) =>
      index === self.findIndex((r) => r.display_text === ref.display_text)
    );

    console.log('📋 Final extracted references:', uniqueReferences.length);
    return uniqueReferences;
  };

  const renderMessageContent = (message, messageIndex) => {
    if (editingMessageIndex === messageIndex) {
      return (
        <div className={styles.editingContainer}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.editTextarea}
            autoFocus
            rows={3}
            disabled={isEditing}
          />
          <div className={styles.editActions}>
            <button
              onClick={handleSaveEdit}
              disabled={isEditing || !editContent.trim()}
              className={styles.saveButton}
            >
              {isEditing ? 'Saving...' : 'Save'}
            </button>
            <button onClick={handleCancelEdit} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      );
    }

    if (message.role === 'user') {
      return <div className={styles.userMessageText}>{message.content}</div>;
    }

    if (message.role === 'assistant') {
      const cleanContent = cleanMessageContent(message.content);
      return (
        <div className={styles.assistantContent}>
          {parseAndFormatBuildingCodeContent(cleanContent, messageIndex)}
        </div>
      );
    }
  };

  // 🔥 UPDATED: Parse bold markdown with tooltip support
  const parseBoldMarkdown = (text, messageIndex) => {
    // Check for Reference patterns
    const hasReference = text.includes('Reference:');

    if (hasReference) {
      console.log('🔍 Processing reference text:', text);
    }

    // Reference pattern - match "Reference: Document Page X"
    const referencePattern = /(Reference:\s*[^\n]+)/gi;

    if (referencePattern.test(text)) {
      // Reset regex
      referencePattern.lastIndex = 0;
      const parts = text.split(referencePattern);

      return parts.map((part, index) => {
        if (part.match(/^\*\*Reference:/i) || part.match(/^Reference:/i)) {
          // 🔥 CRITICAL: Clean the reference text for display
          let referenceText = part.trim();

          // Remove ALL ** markers (beginning, middle, end)
          referenceText = referenceText.replace(/\*\*/g, '');

          // Extract ONLY "Reference: ... Page NUMBER" (stop at page number)
          const refMatch = referenceText.match(/(Reference:[^P]*Page\s+\d+)/i);
          if (refMatch) {
            referenceText = refMatch[1].trim();
          }

          // Final cleanup: remove any remaining asterisks
          referenceText = referenceText.replace(/\*/g, '');

          console.log(`   🔑 Cleaned for lookup: "${referenceText}"`);

          // 🔥 FINAL DISPLAY CLEANING - Remove ALL asterisks before rendering
          const displayText = referenceText.replace(/\*\*/g, '').replace(/\*/g, '');
          console.log(`   🎨 DISPLAY TEXT: "${displayText}"`);
          console.log(`   🔍 Has asterisks in display? ${displayText.includes('*')}`);

          // 🔥 NEW: Track occurrence count for tooltip lookup (using ref)
          const baseKey = `${messageIndex}-${referenceText}`;
          if (!renderOccurrencesRef.current[baseKey]) {
            renderOccurrencesRef.current[baseKey] = 0;
          }
          renderOccurrencesRef.current[baseKey]++;
          
          // Get tooltip text using occurrence-specific key
          const referenceKey = `${baseKey}-occurrence-${renderOccurrencesRef.current[baseKey]}`;
          const tooltipText = referenceTooltips[referenceKey];

          console.log(`🔑 Looking for tooltip: "${referenceKey}"`);
          console.log(`📝 Found: ${tooltipText ? 'YES' : 'NO'}`);
          console.log(`   Occurrence #: ${renderOccurrencesRef.current[baseKey]}`);

          if (tooltipText) {
            console.log(`✅ Tooltip content: "${tooltipText.substring(0, 100)}..."`);
          }

          return (
            <span
              key={index}
              className={styles.referenceText}
              style={{
                color: '#10b981',
                fontWeight: '600',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.9em',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'inline-block',
                margin: '0 4px',
                position: 'relative',
                cursor: tooltipText ? 'help' : 'default'
              }}
            /* No title attribute to avoid duplicate tooltips */
            >
              {displayText}
              {tooltipText && (
                <span className={styles.referenceTooltip}>
                  <span className={styles.tooltipContent}>
                    <span style={{ fontWeight: '600', color: '#10b981', marginBottom: '6px', display: 'block' }}>
                      Regulation States:
                    </span>
                    "{tooltipText}"
                  </span>
                </span>
              )}
            </span>
          );
        } else {
          // Process non-reference text for bold formatting
          const boldPattern = /(\*\*(?!Reference:)[^*]+\*\*)/g;
          const boldParts = part.split(boldPattern);

          return boldParts.map((boldPart, boldIndex) => {
            if (boldPart.match(boldPattern)) {
              const boldText = boldPart.replace(/\*\*/g, '');
              return <strong key={`${index}-${boldIndex}`}>{boldText}</strong>;
            }
            return boldPart;
          });
        }
      });
    }

    // No references - process normally for bold text only
    const boldPattern = /(\*\*[^*]+\*\*)/g;
    const parts = text.split(boldPattern);

    return parts.map((part, index) => {
      if (part.match(boldPattern)) {
        const boldText = part.replace(/\*\*/g, '');
        return <strong key={index}>{boldText}</strong>;
      }
      return part;
    });
  };

  // 🔥 UPDATED: Parse and format building code responses with messageIndex
  const parseAndFormatBuildingCodeContent = (content, messageIndex) => {
    const lines = content.split('\n');
    const elements = [];
    let bullets = [];

    const flushBullets = () => {
      if (bullets.length > 0) {
        elements.push(
          <ul key={`bullets-${elements.length}`} className={styles.bulletList}>
            {bullets.map((bullet, idx) => (
              <li key={idx} className={styles.bulletItem}>
                {parseBoldMarkdown(bullet, messageIndex)}
              </li>
            ))}
          </ul>
        );
        bullets = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        flushBullets();
        return;
      }

      // Skip QUOTED_TEXT lines
      if (trimmedLine.startsWith('QUOTED_TEXT:') || trimmedLine.includes('QUOTED_TEXT:')) {
        console.log('⏭️ Skipping QUOTED_TEXT line');
        return;
      }

      if (trimmedLine.startsWith('•')) {
        const bulletText = trimmedLine.substring(1).trim();
        bullets.push(bulletText);
        return;
      }

      if (trimmedLine.match(/^\d+\./)) {
        flushBullets();
        elements.push(
          <div key={`numbered-${index}`} className={styles.numberedItem}>
            {parseBoldMarkdown(trimmedLine, messageIndex)}
          </div>
        );
        return;
      }

      flushBullets();

      const formattedContent = parseBoldMarkdown(trimmedLine, messageIndex);

      elements.push(
        <div
          key={`content-${index}`}
          className={styles.contentParagraph}
        >
          {formattedContent}
        </div>
      );
    });

    flushBullets();
    return elements;
  };

  // Render feedback buttons for assistant messages
  const renderFeedbackButtons = (message) => {
    if (!message._id || message.role !== 'assistant') {
      return null;
    }

    const messageId = message._id;
    const currentFeedback = feedbackState[messageId];
    const userVote = currentFeedback?.userVote;
    const isSubmitting = currentFeedback?.isSubmitting || false;
    const error = feedbackErrors[messageId];

    return (
      <div className={styles.feedbackContainer}>
        <div className={styles.feedbackQuestion}>Was this response helpful?</div>
        <div className={styles.feedbackButtons}>
          <button
            onClick={() => handleFeedbackClick(messageId, 'helpful')}
            className={`${styles.feedbackButton} ${userVote === 'helpful' ? styles.feedbackButtonActive : ''}`}
            disabled={isSubmitting}
            title="This response was helpful"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={styles.feedbackIcon}
              fill={userVote === 'helpful' ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            <span className={styles.feedbackLabel}>Helpful</span>
          </button>

          <button
            onClick={() => handleFeedbackClick(messageId, 'unhelpful')}
            className={`${styles.feedbackButton} ${userVote === 'unhelpful' ? styles.feedbackButtonActive : ''}`}
            disabled={isSubmitting}
            title="This response was not helpful"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={styles.feedbackIcon}
              fill={userVote === 'unhelpful' ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
              />
            </svg>
            <span className={styles.feedbackLabel}>Not Helpful</span>
          </button>
        </div>

        {successMessage.show && successMessage.messageId === messageId && (
          <div className={styles.feedbackSuccess}>
            ✓ Thank you for your feedback!
          </div>
        )}

        {error && (
          <div className={styles.feedbackError}>
            {error}
          </div>
        )}

        {isSubmitting && (
          <div className={styles.feedbackSubmitting}>
            Saving...
          </div>
        )}
      </div>
    );
  };

  // Smart function to determine if references should be shown
  const shouldShowReferences = (regulation, messageContent) => {
    if (!regulation || regulation.query_type !== "building_codes") {
      return false;
    }

    if (regulation.references && regulation.references.length > 0) {
      console.log('✅ Showing references from regulation object');
      return true;
    }

    if (messageContent) {
      const contentReferences = extractReferencesFromContent(messageContent);
      if (contentReferences.length > 0) {
        console.log('✅ Showing references extracted from message content');
        return true;
      }
    }

    console.log('❌ No references found in regulation object or message content');
    return false;
  };

  // Render regulation result with references section
  const renderRegulationResult = (message, messageIndex) => {
    if (!message.regulation || !message.regulation.answer) {
      console.log(`❌ No regulation data for message ${messageIndex}`);
      return null;
    }

    const regulation = message.regulation;
    const messageContent = message.content;

    console.log(`🔍 Message ${messageIndex} regulation analysis:`, {
      queryType: regulation.query_type,
      hasReferences: !!regulation.references,
      referencesCount: regulation.references?.length || 0,
      shouldShow: shouldShowReferences(regulation, messageContent)
    });

    if (!shouldShowReferences(regulation, messageContent)) {
      console.log(`📝 No regulation container needed for query type: ${regulation.query_type}`);
      return null;
    }

    let referencesToShow = regulation.references || [];

    if (referencesToShow.length === 0 && messageContent) {
      referencesToShow = extractReferencesFromContent(messageContent);
      console.log('🔄 Using content-extracted references as fallback:', referencesToShow.length);
    }

    console.log(`✅ Rendering regulation container with ${referencesToShow.length} references`);

    return (
      <div className={styles.regulationContainer}>
        <div className={styles.regulationHeader}>
          <div className={styles.headerReferencesSection}>
            <div className={styles.headerReferencesTitle}>Also refer these pages:</div>
            <div className={styles.headerReferencesList}>
              {referencesToShow.map((ref, index) => {
                const displayText = ref.display_text || `${ref.document} Page ${ref.page}`;

                return (
                  <div
                    key={index}
                    className={`${styles.headerReferenceItem} ${styles.clickableReference}`}
                    onClick={() => handleCitationClick(ref)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleCitationClick(ref);
                      }
                    }}
                    title="Click to view document"
                  >
                    • {displayText}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (messages.length === 0 && !isGenerating) {
    return (
      <div className={styles.emptyMessages}>
        <div className={styles.welcomeMessage}>
          <div className={styles.examplePrompts}>
            <p className={styles.exampleTitle}>Try asking:</p>
            <ul className={styles.exampleList}>
              <li>"What are the minimum ceiling heights for residential buildings?"</li>
              <li>"Fire escape requirements for 3-story office building"</li>
              <li>"Accessibility requirements for public buildings"</li>
              <li>"Minimum window sizes for emergency egress"</li>
              <li>"Structural requirements for load-bearing walls"</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.messageList}>
      {messages.map((message, index) => (
        <div
          key={index}
          className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
        >
          <div className={styles.messageLayout}>
            <div className={styles.messageAvatar}>
              {message.role === 'user' ? (
                <div className={styles.userAvatar}>
                  <span className={styles.userInitial}>
                    {getUserInitial()}
                  </span>
                </div>
              ) : (
                <div className={styles.assistantAvatar}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={styles.avatarIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
            </div>

            <div className={styles.messageContentArea}>
              <div className={styles.messageContent}>
                {renderMessageContent(message, index)}
              </div>

              <div className={styles.messageContentHeader}>
                {message.role === 'user' && (
                  <div className={styles.messageTimestamp} title={new Date(message.timestamp).toLocaleString('en-GB', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={styles.timestampIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatTimestamp(message.timestamp)}
                  </div>
                )}
              </div>

              {message.role === 'assistant' && renderRegulationResult(message, index)}
              {message.role === 'assistant' && renderFeedbackButtons(message)}
            </div>
          </div>
        </div>
      ))}

      {isGenerating && (
        <div className={styles.message}>
          <div className={styles.messageLayout}>
            <div className={styles.messageAvatar}>
              <div className={styles.assistantAvatar}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.avatarIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>

            <div className={styles.messageContentArea}>
              <div className={styles.messageContent}>
                {/* ✅ SIMPLIFIED: Just icon + rotating text */}
                <div className={styles.progressiveLoadingContainer}>
                  {/* Icon that changes based on phase */}
                  <div className={styles.loadingIconWrapper}>
                    {loadingPhase === 0 && (
                      <svg className={styles.loadingIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    )}
                    {loadingPhase === 1 && (
                      <svg className={styles.loadingIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                    {loadingPhase === 2 && (
                      <svg className={styles.loadingIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>

                  {/* Text with 3D cylindrical rotation - NO DOTS, NO PROGRESS BAR */}
                  <div className={styles.progressiveTextContainer}>
                    <div
                      key={loadingPhase}
                      className={styles.progressiveText}
                    >
                      {loadingPhase === 0 && "Analyzing query requirements..."}
                      {loadingPhase === 1 && "Searching building regulations database..."}
                      {loadingPhase === 2 && "Compiling regulatory compliance report..."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />

      {feedbackModal.isOpen && (
        <FeedbackModal
          isOpen={feedbackModal.isOpen}
          onClose={handleFeedbackCancel}
          onSubmit={handleFeedbackSubmit}
          messageId={feedbackModal.messageId}
          feedbackType={feedbackModal.feedbackType}
        />
      )}
    </div>
  );
}