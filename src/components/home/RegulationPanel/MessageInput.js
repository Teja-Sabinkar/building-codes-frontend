// src/components/home/RegulationPanel/MessageInput.js - Building Codes Assistant
'use client';

import { useState, useRef, useEffect } from 'react';
import VoiceControls from '@/components/common/VoiceControls/VoiceControls';
import { useSpeech } from '@/hooks/useSpeech';
import styles from './MessageInput.module.css';

export default function MessageInput({ 
  onSendMessage, 
  isGenerating, 
  disabled = false, 
  placeholder,
  enableVoice = true 
}) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showVoiceControls, setShowVoiceControls] = useState(false);
  const [voiceInputMode, setVoiceInputMode] = useState(false);
  const textareaRef = useRef(null);

  const { isSupported: isVoiceSupported } = useSpeech();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isGenerating && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      setShowVoiceControls(false);
      setVoiceInputMode(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceTranscript = (transcript) => {
    if (voiceInputMode) {
      // Replace the current message with voice input
      setMessage(transcript);
    } else {
      // Append to existing message
      const newMessage = message ? `${message} ${transcript}` : transcript;
      setMessage(newMessage);
    }
    
    // Focus the textarea after voice input
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleVoiceStart = () => {
    setShowVoiceControls(true);
    // Don't clear existing text unless in voice-only mode
    if (voiceInputMode) {
      setMessage('');
    }
  };

  const handleVoiceEnd = () => {
    // Keep voice controls visible but no longer listening
    setVoiceInputMode(false);
  };

  const toggleVoiceControls = () => {
    setShowVoiceControls(!showVoiceControls);
    if (!showVoiceControls) {
      setVoiceInputMode(true);
    }
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (disabled) return "Please start a conversation first...";
    if (isGenerating) return "Searching building regulations...";
    if (voiceInputMode) return "Use voice input or type your regulation question here...";
    return "Ask about building codes, regulations, or compliance requirements...";
  };

  return (
    <div className={styles.inputContainer}>
      {/* Voice Controls (when enabled and shown) */}
      {enableVoice && isVoiceSupported && showVoiceControls && (
        <div className={styles.voiceSection}>
          <VoiceControls
            onTranscriptReady={handleVoiceTranscript}
            onSpeechStart={handleVoiceStart}
            onSpeechEnd={handleVoiceEnd}
            placeholder="Voice input will appear here..."
            disabled={disabled || isGenerating}
            className={styles.voiceControls}
          />
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <div className={`${styles.inputWrapper} ${isFocused ? styles.focused : ''} ${disabled ? styles.disabled : ''}`}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={getPlaceholder()}
            className={styles.textarea}
            disabled={isGenerating || disabled}
            rows={1}
          />
          
          <div className={styles.inputActions}>
            {/* Voice Toggle Button */}
            {enableVoice && isVoiceSupported && (
              <button
                type="button"
                onClick={toggleVoiceControls}
                className={`${styles.voiceButton} ${showVoiceControls ? styles.voiceButtonActive : ''}`}
                disabled={isGenerating || disabled}
                title={showVoiceControls ? "Hide voice input" : "Show voice input"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.voiceIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}

            {/* Character count (show when typing) */}
            {message.length > 0 && !disabled && (
              <span className={styles.characterCount}>
                {message.length}
              </span>
            )}
            
            {/* Send button */}
            <button
              type="submit"
              disabled={!message.trim() || isGenerating || disabled}
              className={`${styles.sendButton} ${
                message.trim() && !isGenerating && !disabled ? styles.sendButtonActive : ''
              }`}
              title={disabled ? "Please start a conversation first" : "Send message (Enter)"}
            >
              {isGenerating ? (
                <div className={styles.loadingSpinner}>
                  <svg className={styles.spinnerIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3"/>
                    <path d="M4 12a8 8 0 0 1 8-8V2.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                </div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.sendIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* UPDATED: Helper text with new tips */}
        <div className={styles.helperText}>
          {disabled ? (
            <span className={styles.disabledTip}>
              ⚠️ Your building codes assistant is currently working on a report, please wait.
            </span>
          ) : (
            <div className={styles.tipsContainer}>
              <div className={styles.tip}>
                💡 <strong>Tip 1:</strong> Be specific about building types, occupancy classifications, and local requirements. Ask about specific codes like IBC, IRC, or local amendments.
              </div>
              <div className={styles.tip}>
                🔬 <strong>Tip 2:</strong> This is an early stage prototype please make sure to check the regulation books before proceeding.
              </div>
              <div className={styles.tip}>
                ⌨️ <strong>Tip 3:</strong> Press Enter to send • Shift+Enter for new line.
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}