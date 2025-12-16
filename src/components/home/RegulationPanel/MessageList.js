// src/components/home/RegulationPanel/MessageList.js - Building Codes Assistant - UPDATED WITH FEEDBACK MODAL
'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './MessageList.module.css';
import FeedbackModal from './FeedbackModal';

export default function MessageList({
  messages,
  isGenerating,
  onEditMessage,
  user,
  conversationId,  // Add conversationId prop
  onCitationClick  // NEW: Handle citation clicks to open document viewer
}) {
  const messagesEndRef = useRef(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // 🆕 Feedback state
  const [feedbackState, setFeedbackState] = useState({}); // { messageId: { userVote: 'helpful'|'unhelpful', isSubmitting: false } }
  const [feedbackErrors, setFeedbackErrors] = useState({});

  // 🆕 Feedback modal state
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    messageId: null,
    feedbackType: null // 'helpful' or 'unhelpful'
  });

  // 🆕 Success message state
  const [successMessage, setSuccessMessage] = useState({
    messageId: null,
    show: false
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // 🆕 Initialize feedback state from messages
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

  // 🆕 Handle feedback button click - UPDATED to show modal
  const handleFeedbackClick = async (messageId, vote) => {
    if (!conversationId || !messageId) {
      console.error('Missing conversationId or messageId');
      return;
    }

    // Check if user is trying to click the same vote again
    const currentVote = feedbackState[messageId]?.userVote;
    if (currentVote === vote) {
      console.log('User clicked the same vote - no action needed');
      return;
    }

    console.log('👍 Opening feedback modal:', { messageId, vote, currentVote });

    // Open feedback modal
    setFeedbackModal({
      isOpen: true,
      messageId: messageId,
      feedbackType: vote
    });
  };

  // 🆕 Handle feedback modal submission
  const handleFeedbackSubmit = async (feedbackData) => {
    const { messageId, feedbackType } = feedbackData;

    console.log('📝 Submitting feedback with details:', feedbackData);

    // Set submitting state
    setFeedbackState(prev => ({
      ...prev,
      [messageId]: { userVote: feedbackType, isSubmitting: true }
    }));

    // Clear any previous errors
    setFeedbackErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[messageId];
      return newErrors;
    });

    try {
      // Get auth token
      const token = localStorage.getItem('authToken');

      if (!token) {
        throw new Error('Not authenticated');
      }

      // Send feedback to API with detailed feedback
      const response = await fetch('/api/messages/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId,
          messageId,
          vote: feedbackType,
          issueType: feedbackData.issueType || null,
          details: feedbackData.details || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save feedback');
      }

      const data = await response.json();
      console.log('✅ Feedback saved to database:', data);

      // Update local state with success
      setFeedbackState(prev => ({
        ...prev,
        [messageId]: { userVote: feedbackType, isSubmitting: false }
      }));

      // Close modal
      setFeedbackModal({ isOpen: false, messageId: null, feedbackType: null });

      // Show success message
      setSuccessMessage({ messageId, show: true });

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage({ messageId: null, show: false });
      }, 3000);

      console.log('✅ Feedback saved successfully');

    } catch (error) {
      console.error('❌ Feedback error:', error);

      // Revert to previous state on error
      const currentVote = feedbackState[messageId]?.userVote;
      setFeedbackState(prev => ({
        ...prev,
        [messageId]: { userVote: currentVote, isSubmitting: false }
      }));

      // Set error message
      setFeedbackErrors(prev => ({
        ...prev,
        [messageId]: error.message
      }));

      // Close modal on error too
      setFeedbackModal({ isOpen: false, messageId: null, feedbackType: null });
    }
  };

  // 🆕 Handle feedback modal close
  const handleFeedbackModalClose = () => {
    setFeedbackModal({ isOpen: false, messageId: null, feedbackType: null });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';

    try {
      // Handle both string and Date object formats
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

      if (isNaN(date.getTime())) {
        console.warn('formatTime: Invalid date:', timestamp);
        return 'Just now';
      }

      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('formatTime error:', error, 'Input:', timestamp);
      return 'Just now';
    }
  };

  const handleEditStart = (messageIndex, currentContent) => {
    console.log('Starting edit for message:', messageIndex);
    setEditingMessageIndex(messageIndex);
    setEditContent(currentContent);
    setIsEditing(false);
  };

  const handleEditSave = async () => {
    if (editContent.trim() && editingMessageIndex !== null && !isEditing) {
      console.log('Saving edit:', { editingMessageIndex, editContent });
      setIsEditing(true);

      try {
        await onEditMessage(editingMessageIndex, editContent.trim());
        setEditingMessageIndex(null);
        setEditContent('');
      } catch (error) {
        console.error('Error editing message:', error);
      } finally {
        setIsEditing(false);
      }
    }
  };

  const handleEditCancel = () => {
    console.log('Canceling edit');
    setEditingMessageIndex(null);
    setEditContent('');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  // Get user initials for avatar
  const getUserInitial = () => {
    if (!user || !user.name) return 'U';
    return user.name.charAt(0).toUpperCase();
  };

  // Process message content to clean for display
  const processMessageContent = (content) => {
    // Remove code blocks and technical formatting
    let processedContent = content
      .replace(/```[\s\S]*?```/gi, '')
      .replace(/`[^`]*`/gi, '');

    // Remove CITATION section and everything after it
    processedContent = processedContent.replace(/\*\*CITATION\*\*[\s\S]*$/gi, '');

    // Also remove "Citation:" lines
    processedContent = processedContent.replace(/^Citation:.*$/gmi, '');

    // Clean up extra whitespace and newlines
    processedContent = processedContent
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .replace(/^\s*\n+/g, '')
      .replace(/\n+\s*$/g, '')
      .trim();

    return processedContent;
  };

  // NEW: Handle citation click to open document viewer
  const handleCitationClick = (ref) => {
    if (onCitationClick) {
      console.log('📄 Citation clicked - FULL OBJECT:', JSON.stringify(ref, null, 2));
      console.log('📄 Has highlight_markers?', ref.highlight_markers ? 'YES' : 'NO');
      if (ref.highlight_markers) {
        console.log('📄 highlight_markers count:', ref.highlight_markers.length);
      }

      // Pass ALL fields including highlight_markers
      onCitationClick({
        document: ref.document,
        page: ref.page,
        country: ref.country,
        source: ref.source,
        highlight_markers: ref.highlight_markers  // ✨ CRITICAL: Pass highlight_markers!
      });
    }
  };


  // NEW: Extract references from message content as fallback
  const extractReferencesFromContent = (messageContent) => {
    if (!messageContent) return [];

    console.log('📋 Extracting references from content...');

    // Look for reference patterns in the message content
    const referencePatterns = [
      /\*\*Reference:\s*([^*]+)\*\*/g,  // **Reference: Building standards... Page 32**
      /Reference:\s*([^*\n]+)/g,        // Reference: Building standards... Page 32
    ];

    const foundReferences = [];

    for (const pattern of referencePatterns) {
      let match;
      while ((match = pattern.exec(messageContent)) !== null) {
        const referenceText = match[1].trim();
        console.log('📋 Found reference text:', referenceText);

        // Extract document and page from reference text
        const pageMatch = referenceText.match(/^(.+?)\s+Page\s+(\d+)$/i);
        if (pageMatch) {
          const document = pageMatch[1].trim();
          const page = pageMatch[2];

          foundReferences.push({
            document: document,
            page: page,
            display_text: `${document} Page ${page}`,
            country: "Scotland" // Default for now - could be enhanced to detect country
          });

          console.log('✅ Extracted reference:', `${document} Page ${page}`);
        }
      }
    }

    // Remove duplicates
    const uniqueReferences = foundReferences.filter((ref, index, self) =>
      index === self.findIndex((r) => r.display_text === ref.display_text)
    );

    console.log('📋 Final extracted references:', uniqueReferences.length);
    return uniqueReferences;
  };

  const renderMessageContent = (message, messageIndex) => {
    // If this message is being edited
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
              onClick={handleEditSave}
              className={`${styles.editButton} ${styles.saveButton}`}
              disabled={!editContent.trim() || isEditing}
            >
              {isEditing ? (
                <>
                  <div className={styles.editSpinner}></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className={styles.editIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save & Regenerate
                </>
              )}
            </button>
            <button
              onClick={handleEditCancel}
              className={`${styles.editButton} ${styles.cancelButton}`}
              disabled={isEditing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.editIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </div>
        </div>
      );
    }

    const cleanContent = processMessageContent(message.content);

    // Enhanced message display with professional building code formatting
    return (
      <div className={styles.textContent}>
        {parseAndFormatBuildingCodeContent(cleanContent)}
      </div>
    );
  };

  // Function to parse bold markdown and format text - FIXED VERSION
  const parseBoldMarkdown = (text) => {
    // Debug logging - remove these console.log statements after fixing
    if (text.includes('Reference') || text.includes('Source')) {
      console.log('🔍 Processing text with reference:', text);
    }

    // Multiple reference patterns to support different formats
    const referencePatterns = [
      {
        regex: /(\*\*Reference:[^*]+\*\*)/g,
        name: 'Standard format'
      },
      {
        regex: /(\(Reference:[^)]+\))/g,
        name: 'Parentheses format'
      },
      {
        regex: /(\*\*Source:[^*]+\*\*)/g,
        name: 'Source format'
      }
    ];

    // Try each pattern until we find a match
    for (const { regex, name } of referencePatterns) {
      const matches = text.match(regex);
      if (matches) {
        console.log(`✅ Found ${name} references:`, matches);

        const parts = text.split(regex);

        return parts.map((part, index) => {
          if (part.match(regex)) {
            // FIXED: Remove asterisks from display text
            const cleanReferenceText = part.replace(/\*\*/g, '').replace(/[()]/g, '');

            // Apply reference styling with clean text
            return (
              <span
                key={index}
                className={styles.referenceText}
                style={{
                  color: '#059669',
                  fontWeight: '600',
                  backgroundColor: 'rgba(5, 150, 105, 0.1)',
                  padding: '0.125rem 0.25rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.85rem',
                  border: '1px solid rgba(5, 150, 105, 0.2)',
                  display: 'inline',
                  margin: '0 0.125rem'
                }}
                data-reference="true"
              >
                {cleanReferenceText}
              </span>
            );
          } else {
            // Process non-reference text for bold formatting
            const boldPattern = /(\*\*(?!Reference:)(?!Source:)[^*]+\*\*)/g;
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
    }

    // No references found - process normally for bold text only
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

  // Parse and format building code responses
  const parseAndFormatBuildingCodeContent = (content) => {
    const lines = content.split('\n');
    const elements = [];
    let bullets = [];

    const flushBullets = () => {
      if (bullets.length > 0) {
        elements.push(
          <div key={`bullets-${elements.length}`} className={styles.bulletsContainer}>
            {bullets.map((bullet, idx) => (
              <div key={idx} className={styles.bulletItem}>
                <span className={styles.bulletMarker}>•</span>
                <div className={styles.bulletContent}>{bullet}</div>
              </div>
            ))}
          </div>
        );
        bullets = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine === '') return;

      // Log lines that might contain references for debugging
      if (trimmedLine.includes('Reference') || trimmedLine.includes('Source')) {
        console.log(`📋 Line ${index} might contain reference:`, trimmedLine);
      }

      // Check for bold headers (like **CLEAR FLOOR SPACE**)
      if (trimmedLine.match(/^\*\*[^*]+\*\*$/) && !trimmedLine.includes('Reference')) {
        flushBullets();
        const headerText = trimmedLine.replace(/\*\*/g, '');
        elements.push(
          <div key={`bold-header-${index}`} className={styles.mainHeader}>
            <h3 className={styles.mainTitle}>
              {headerText}
            </h3>
          </div>
        );
        return;
      }

      // Headers (end with colon)
      if (trimmedLine.endsWith(':') &&
        !trimmedLine.includes('Citation:') &&
        !trimmedLine.includes('Applicability:')) {

        flushBullets();
        const headerContent = parseBoldMarkdown(trimmedLine.replace(':', ''));
        elements.push(
          <div key={`header-${index}`} className={styles.mainHeader}>
            <h3 className={styles.mainTitle}>
              {headerContent}
            </h3>
          </div>
        );
        return;
      }

      // Bullet points
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        const bulletText = trimmedLine.substring(2).trim();
        const formattedBulletText = parseBoldMarkdown(bulletText);
        bullets.push(formattedBulletText);
        return;
      }

      // Citation
      if (trimmedLine.startsWith('Citation:')) {
        flushBullets();
        const citationText = trimmedLine.replace('Citation:', '').trim();
        const formattedCitation = parseBoldMarkdown(citationText);
        elements.push(
          <div key={`citation-${index}`} className={styles.fieldContainer}>
            <div className={styles.fieldRow}>
              <div className={styles.fieldLabel}>Source:</div>
              <div className={styles.fieldValue}>{formattedCitation}</div>
            </div>
          </div>
        );
        return;
      }

      // Applicability
      if (trimmedLine.startsWith('Applicability:')) {
        flushBullets();
        const applicabilityText = trimmedLine.replace('Applicability:', '').trim();
        const formattedApplicability = parseBoldMarkdown(applicabilityText);
        elements.push(
          <div key={`applicability-${index}`} className={styles.fieldContainer}>
            <div className={styles.fieldRow}>
              <div className={styles.fieldLabel}>Applies to:</div>
              <div className={styles.fieldValue}>{formattedApplicability}</div>
            </div>
          </div>
        );
        return;
      }

      // Regular content - this is where most references will be processed
      flushBullets();
      const formattedContent = parseBoldMarkdown(trimmedLine);
      elements.push(
        <div key={`content-${index}`} className={styles.contentParagraph}>
          {formattedContent}
        </div>
      );
    });

    flushBullets();
    return elements;
  };

  // 🆕 Render feedback buttons for assistant messages
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
          {/* Helpful Button */}
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

          {/* Not Helpful Button */}
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

        {/* Success message */}
        {successMessage.show && successMessage.messageId === messageId && (
          <div className={styles.feedbackSuccess}>
            ✓ Thank you for your feedback!
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className={styles.feedbackError}>
            {error}
          </div>
        )}

        {/* Submitting indicator */}
        {isSubmitting && (
          <div className={styles.feedbackSubmitting}>
            Saving...
          </div>
        )}
      </div>
    );
  };

  // UPDATED: Smart function to determine if references should be shown (with fallback)
  const shouldShowReferences = (regulation, messageContent) => {
    if (!regulation || regulation.query_type !== "building_codes") {
      return false;
    }

    // Check if we have references in the regulation object
    if (regulation.references && regulation.references.length > 0) {
      console.log('✅ Showing references from regulation object');
      return true;
    }

    // FALLBACK: Check if we can extract references from message content
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

  // UPDATED: renderRegulationResult with content fallback
  const renderRegulationResult = (message, messageIndex) => {
    if (!message.regulation || !message.regulation.answer) {
      console.log(`❌ No regulation data for message ${messageIndex}`);
      return null;
    }

    const regulation = message.regulation;
    const messageContent = message.content;

    // Log query type detection (console only - not visible to users)
    console.log(`🔍 Message ${messageIndex} regulation analysis:`, {
      queryType: regulation.query_type,
      hasReferences: !!regulation.references,
      referencesCount: regulation.references?.length || 0,
      shouldShow: shouldShowReferences(regulation, messageContent)
    });

    // Check if we should show references (with fallback)
    if (!shouldShowReferences(regulation, messageContent)) {
      console.log(`📝 No regulation container needed for query type: ${regulation.query_type}`);
      return null;
    }

    // Get references - either from regulation object or extract from content
    let referencesToShow = regulation.references || [];

    if (referencesToShow.length === 0 && messageContent) {
      // Use content extraction as fallback
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
              {/* Display as bullet points */}
              {referencesToShow.map((ref, index) => (
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
                >
                  • {ref.display_text || `${ref.document} Page ${ref.page}`}
                </div>
              ))}
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
          className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage
            }`}
        >
          <div className={styles.messageLayout}>
            {/* Avatar */}
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

            {/* Message content area */}
            <div className={styles.messageContentArea}>
              {/* Message Content */}
              <div className={styles.messageContent}>
                {renderMessageContent(message, index)}
              </div>

              {/* Message Header with actions */}
              <div className={styles.messageContentHeader}>
                <div className={styles.contentHeaderLeft}>
                  <span className={styles.messageTime}>
                    {formatTime(message.timestamp)}
                  </span>
                  {message.isEdited && (
                    <span className={styles.editedBadge} title={`Edited ${formatTime(message.editedAt)}`}>
                      Edited
                    </span>
                  )}
                </div>


                <div className={styles.contentHeaderRight}>
                  {/* Edit button for user messages */}
                  {/* 
                  {message.role === 'user' && editingMessageIndex !== index && !isGenerating && (
                    <button
                      onClick={() => handleEditStart(index, message.content)}
                      className={styles.actionButton}
                      title="Edit message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={styles.actionIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                    */}
                </div>

              </div>

              {/* Render regulation result for assistant messages with query type awareness */}
              {message.role === 'assistant' && renderRegulationResult(message, index)}

              {/* 🆕 Render feedback buttons for assistant messages */}
              {message.role === 'assistant' && renderFeedbackButtons(message)}
            </div>
          </div>
        </div>
      ))}

      {/* Generating indicator */}
      {isGenerating && (
        <div className={`${styles.message} ${styles.assistantMessage} ${styles.generatingMessage}`}>
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
                <div className={styles.generatingIndicator}>
                  <div className={styles.typingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className={styles.generatingText}>
                    Analyzing building regulations and preparing professional compliance report...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={handleFeedbackModalClose}
        onSubmit={handleFeedbackSubmit}
        feedbackType={feedbackModal.feedbackType}
        messageId={feedbackModal.messageId}
      />
    </div>
  );
}