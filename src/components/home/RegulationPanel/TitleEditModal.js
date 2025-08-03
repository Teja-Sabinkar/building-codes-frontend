// src/components/home/RegulationPanel/TitleEditModal.js
'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './TitleEditModal.module.css';

export default function TitleEditModal({
  isOpen,
  currentTitle,
  onSave,
  onCancel,
  isLoading = false
}) {
  const [title, setTitle] = useState(currentTitle || '');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle || '');
      setError('');
      // Focus input after modal opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, currentTitle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedTitle = title.trim();
    
    // Validation
    if (!trimmedTitle) {
      setError('Title cannot be empty');
      return;
    }
    
    if (trimmedTitle.length > 100) {
      setError('Title must be 100 characters or less');
      return;
    }
    
    if (trimmedTitle === currentTitle) {
      // No change, just close
      onCancel();
      return;
    }
    
    setError('');
    
    try {
      await onSave(trimmedTitle);
    } catch (error) {
      setError(error.message || 'Failed to update title');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleCancel = () => {
    setTitle(currentTitle || '');
    setError('');
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Edit Conversation Title</h3>
          <button
            onClick={handleCancel}
            className={styles.closeButton}
            title="Close"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.closeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="regulation-session-title" className={styles.label}>
              Session Title
            </label>
            <input
              ref={inputRef}
              id="regulation-session-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              placeholder="Enter a descriptive title for this regulation session"
              maxLength={100}
              disabled={isLoading}
              autoComplete="off"
            />
            
            <div className={styles.inputMeta}>
              <span className={styles.charCount}>
                {title.length}/100 characters
              </span>
            </div>

            
            {error && (
              <div className={styles.errorMessage}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.errorIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isLoading || !title.trim() || title.trim() === currentTitle}
            >
              {isLoading ? (
                <>
                  <div className={styles.loadingSpinner}></div>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}