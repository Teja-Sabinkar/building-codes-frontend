// src/components/settings/ClearHistory.js - REG-GPT Clear History Modal
import { useState } from 'react';
import styles from './ClearHistory.module.css';

export default function ClearHistory({ isOpen, onClose, onConfirm, isLoading }) {
  const [confirmText, setConfirmText] = useState('');
  const [isConfirmValid, setIsConfirmValid] = useState(false);

  const handleConfirmTextChange = (e) => {
    const value = e.target.value;
    setConfirmText(value);
    setIsConfirmValid(value.toUpperCase() === 'CLEAR');
  };

  const handleConfirm = () => {
    if (isConfirmValid && !isLoading) {
      onConfirm();
      // Reset form after confirm
      setConfirmText('');
      setIsConfirmValid(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
      // Reset form when canceling
      setConfirmText('');
      setIsConfirmValid(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isLoading) {
      handleCancel();
    }
    if (e.key === 'Enter' && isConfirmValid && !isLoading) {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div 
        className={styles.modalOverlay}
        onClick={handleCancel}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Modal Content */}
        <div 
          className={styles.modalContent}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-labelledby="clear-history-title"
          aria-describedby="clear-history-description"
        >
          {/* Modal Header */}
          <div className={styles.modalHeader}>
            <div className={styles.headerIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.warningIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className={styles.headerText}>
              <h2 id="clear-history-title" className={styles.modalTitle}>
                Clear Conversation History
              </h2>
              <button
                onClick={handleCancel}
                className={styles.closeButton}
                title="Close modal"
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.closeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className={styles.modalBody}>
            <p id="clear-history-description" className={styles.warningText}>
              This action will permanently delete all your conversation history and building code queries. 
              This includes:
            </p>
            
            <ul className={styles.warningList}>
              <li>All previous building code conversations</li>
              <li>Query history and regulation references</li>
              <li>Saved conversation metadata</li>
              <li>Any archived conversations</li>
            </ul>

            <div className={styles.importantNote}>
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.noteIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={styles.noteText}>
                <strong>This action cannot be undone.</strong> Make sure you have saved any important building code information before proceeding.
              </span>
            </div>

            {/* Confirmation Input */}
            <div className={styles.confirmationSection}>
              <label htmlFor="confirm-input" className={styles.confirmLabel}>
                Type <strong>"CLEAR"</strong> to confirm this action:
              </label>
              <input
                id="confirm-input"
                type="text"
                value={confirmText}
                onChange={handleConfirmTextChange}
                className={styles.confirmInput}
                placeholder="Type CLEAR here"
                autoComplete="off"
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className={styles.modalFooter}>
            <button
              onClick={handleCancel}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`${styles.confirmButton} ${isConfirmValid ? styles.confirmButtonEnabled : styles.confirmButtonDisabled}`}
              disabled={!isConfirmValid || isLoading}
            >
              {isLoading ? (
                <>
                  <svg className={styles.loadingSpinner} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3"/>
                    <path d="M4 12a8 8 0 0 1 8-8V2.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                  Clearing History...
                </>
              ) : (
                'Clear History'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}