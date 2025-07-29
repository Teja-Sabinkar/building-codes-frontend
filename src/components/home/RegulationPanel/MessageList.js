// src/components/home/RegulationPanel/MessageList.js - Building Codes Assistant
'use client';

import { useEffect, useRef, useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import styles from './MessageList.module.css';

export default function MessageList({
  messages,
  isGenerating,
  onEditMessage,
  user,
  enableTTS = true
}) {
  const messagesEndRef = useRef(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);
  // Track previous message count to detect truly new messages
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {
    speak,
    stopSpeaking,
    isSpeaking,
    isSupported: isTTSSupported
  } = useSpeech();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Handle initial load detection
  useEffect(() => {
    if (messages.length > 0 && isInitialLoad) {
      setPreviousMessageCount(messages.length);
      setIsInitialLoad(false);
    }
  }, [messages, isInitialLoad]);

  // Reset initial load state when conversation changes
  useEffect(() => {
    if (previousMessageCount > 0 && messages.length === 0) {
      setIsInitialLoad(true);
      setPreviousMessageCount(0);
    }
  }, [messages.length, previousMessageCount]);

  // Auto-speak new assistant messages
  useEffect(() => {
    if (!enableTTS || !isTTSSupported || isInitialLoad) return;

    const messageCountIncreased = messages.length > previousMessageCount;
    if (!messageCountIncreased) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage &&
      lastMessage.role === 'assistant' &&
      !isGenerating) {

      const textContent = processMessageContent(lastMessage.content);
      if (textContent.trim()) {
        setTimeout(() => {
          handleSpeakMessage(messages.length - 1, textContent);
        }, 500);
      }
    }

    setPreviousMessageCount(messages.length);
  }, [messages, isGenerating, enableTTS, isTTSSupported, previousMessageCount, isInitialLoad]);

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Text-to-Speech Functions
  const handleSpeakMessage = async (messageIndex, textContent = null) => {
    if (!enableTTS || !isTTSSupported) return;

    const message = messages[messageIndex];
    if (!message) return;

    // Stop any current speech
    if (isSpeaking) {
      stopSpeaking();
      setSpeakingMessageIndex(null);
      return;
    }

    const content = textContent || processMessageContent(message.content);
    if (!content.trim()) return;

    try {
      setSpeakingMessageIndex(messageIndex);
      await speak(content, {
        rate: 0.9,
        pitch: 1.0,
        volume: 0.8
      });
    } catch (error) {
      console.error('TTS Error:', error);
    } finally {
      setSpeakingMessageIndex(null);
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setSpeakingMessageIndex(null);
  };

  // Get user initials for avatar
  const getUserInitial = () => {
    if (!user || !user.name) return 'U';
    return user.name.charAt(0).toUpperCase();
  };

  // Process message content to clean for TTS and remove unwanted content
  const processMessageContent = (content) => {
    // Remove code blocks and technical formatting
    let processedContent = content
      .replace(/```[\s\S]*?```/gi, '')
      .replace(/`[^`]*`/gi, '');

    // Clean up extra whitespace and newlines
    processedContent = processedContent
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .replace(/^\s*\n+/g, '')
      .replace(/\n+\s*$/g, '')
      .trim();

    return processedContent;
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

  // NEW: Function to format references in green
  const formatReferences = (text) => {
    // Pattern to match (Reference: ...) text
    const referencePattern = /(\(Reference:[^)]+\))/g;
    
    const parts = text.split(referencePattern);
    
    return parts.map((part, index) => {
      if (part.match(referencePattern)) {
        return (
          <span key={index} className={styles.referenceText}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // NEW: Add this function to parse and format building code responses
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

      // Headers (end with colon)
      if (trimmedLine.endsWith(':') &&
        !trimmedLine.includes('Citation:') &&
        !trimmedLine.includes('Applicability:')) {

        flushBullets();
        elements.push(
          <div key={`header-${index}`} className={styles.mainHeader}>
            <h3 className={styles.mainTitle}>
              {trimmedLine.replace(':', '')}
            </h3>
          </div>
        );
        return;
      }

      // Bullet points
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        const bulletText = trimmedLine.substring(2).trim();
        // Parse references and make them green
        const formattedBulletText = formatReferences(bulletText);
        bullets.push(formattedBulletText);
        return;
      }

      // Citation
      if (trimmedLine.startsWith('Citation:')) {
        flushBullets();
        const citationText = trimmedLine.replace('Citation:', '').trim();
        elements.push(
          <div key={`citation-${index}`} className={styles.fieldContainer}>
            <div className={styles.fieldRow}>
              <div className={styles.fieldLabel}>Source:</div>
              <div className={styles.fieldValue}>{citationText}</div>
            </div>
          </div>
        );
        return;
      }

      // Applicability
      if (trimmedLine.startsWith('Applicability:')) {
        flushBullets();
        const applicabilityText = trimmedLine.replace('Applicability:', '').trim();
        elements.push(
          <div key={`applicability-${index}`} className={styles.fieldContainer}>
            <div className={styles.fieldRow}>
              <div className={styles.fieldLabel}>Applies to:</div>
              <div className={styles.fieldValue}>{applicabilityText}</div>
            </div>
          </div>
        );
        return;
      }

      // Regular content
      flushBullets();
      const formattedContent = formatReferences(trimmedLine);
      elements.push(
        <div key={`content-${index}`} className={styles.contentParagraph}>
          {formattedContent}
        </div>
      );
    });

    flushBullets();
    return elements;
  };

  const renderRegulationResult = (message, messageIndex) => {
    if (!message.regulation || !message.regulation.answer) return null;

    const regulation = message.regulation;

    return (
      <div className={styles.regulationContainer}>
        <div className={styles.regulationHeader}>
          {/* UPDATED: Show references in header */}
          {regulation.references && regulation.references.length > 0 && (
            <div className={styles.headerReferencesSection}>
              <div className={styles.headerReferencesTitle}>
                Also refer these pages:
              </div>
              <div className={styles.headerReferencesList}>
                {regulation.references.map((ref, index) => (
                  <span key={index} className={styles.headerReferenceItem}>
                    Page {ref.page}
                    {index < regulation.references.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* REMOVED: References section is now in header */}
      </div>
    );
  };

  if (messages.length === 0 && !isGenerating) {
    return (
      <div className={styles.emptyMessages}>
        <div className={styles.welcomeMessage}>
          <h3>Welcome to Building Codes AI!</h3>
          <p>Get instant, professional building code compliance reports with AI-powered analysis and precise citations.</p>

          <div className={styles.capabilities}>
            <h4>Professional Building Code Analysis:</h4>
            <ul>
              <li>🏗️ Building code requirements & compliance</li>
              <li>🔥 Fire safety & egress regulations</li>
              <li>♿ ADA accessibility standards</li>
              <li>🏢 Occupancy classifications</li>
              <li>🔧 Structural design standards</li>
              <li>📋 Zoning & development regulations</li>
            </ul>
          </div>

          <div className={styles.regulationNote}>
            <div className={styles.noteIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.noteIconSvg} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={styles.noteContent}>
              <strong>Professional Report Format:</strong> Every response includes structured compliance summaries, specific code citations, and detailed requirement breakdowns designed for architecture professionals.
              {enableTTS && isTTSSupported && (
                <>
                  <br /><strong>🔊 Voice Features:</strong> Ask questions hands-free and listen to responses while working on designs.
                </>
              )}
            </div>
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
                  {/* TTS button for assistant messages */}
                  {message.role === 'assistant' && enableTTS && isTTSSupported && (
                    <button
                      onClick={() => handleSpeakMessage(index)}
                      className={`${styles.actionButton} ${speakingMessageIndex === index ? styles.speaking : ''}`}
                      title={speakingMessageIndex === index ? "Stop speaking" : "Read aloud"}
                    >
                      {speakingMessageIndex === index ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className={styles.actionIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6v6H9z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className={styles.actionIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 21a1 1 0 01-1-1v-4a1 1 0 011-1h2l4-4V7l-4-4H9a1 1 0 01-1 1v4a1 1 0 011 1z" />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Edit button for user messages */}
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
                </div>
              </div>

              {/* Render regulation result for assistant messages */}
              {message.role === 'assistant' && renderRegulationResult(message, index)}
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
    </div>
  );
}