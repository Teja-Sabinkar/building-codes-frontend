// src/components/settings/DeleteModel.js - Account Deletion Modal for REG-GPT
import { useState } from 'react';
import styles from './DeleteModel.module.css';

export default function DeleteModel({ isOpen, onClose, onConfirm, isLoading, user }) {
  const [confirmText, setConfirmText] = useState('');
  const [isConfirmValid, setIsConfirmValid] = useState(false);
  const [acknowledgmentChecked, setAcknowledmentChecked] = useState(false);

  const handleConfirmTextChange = (e) => {
    const value = e.target.value;
    setConfirmText(value);
    setIsConfirmValid(value.toUpperCase() === 'DELETE');
  };

  const handleConfirm = () => {
    if (isConfirmValid && acknowledgmentChecked && !isLoading) {
      onConfirm();
      // Reset form after confirm
      setConfirmText('');
      setIsConfirmValid(false);
      setAcknowledmentChecked(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
      // Reset form when canceling
      setConfirmText('');
      setIsConfirmValid(false);
      setAcknowledmentChecked(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isLoading) {
      handleCancel();
    }
    if (e.key === 'Enter' && isConfirmValid && acknowledgmentChecked && !isLoading) {
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
          aria-labelledby="delete-account-title"
          aria-describedby="delete-account-description"
        >
          {/* Modal Header */}
          <div className={styles.modalHeader}>
            <div className={styles.headerIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.dangerIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className={styles.headerText}>
              <h2 id="delete-account-title" className={styles.modalTitle}>
                Delete Account Permanently
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
            <div className={styles.userInfo}>
              <p className={styles.userDetail}>
                <strong>Account:</strong> {user?.name} ({user?.email})
              </p>
            </div>

            <div className={styles.criticalWarning}>
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.warningIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className={styles.warningContent}>
                <strong>This action cannot be undone.</strong>
                <p id="delete-account-description">This will permanently delete your REG-GPT account and all associated data.</p>
              </div>
            </div>

            {/* Acknowledgment Checkbox */}
            <div className={styles.acknowledgmentSection}>
              <label className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={acknowledgmentChecked}
                  onChange={(e) => setAcknowledmentChecked(e.target.checked)}
                  className={styles.checkbox}
                  disabled={isLoading}
                />
                <span className={styles.checkboxLabel}>
                  I understand that this action is permanent and cannot be undone.
                </span>
              </label>
            </div>

            {/* Confirmation Input */}
            <div className={styles.confirmationSection}>
              <label htmlFor="confirm-input" className={styles.confirmLabel}>
                Type <strong>"DELETE"</strong> to confirm account deletion:
              </label>
              <input
                id="confirm-input"
                type="text"
                value={confirmText}
                onChange={handleConfirmTextChange}
                className={styles.confirmInput}
                placeholder="Type DELETE here"
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
              className={`${styles.deleteButton} ${(isConfirmValid && acknowledgmentChecked) ? styles.deleteButtonEnabled : styles.deleteButtonDisabled}`}
              disabled={!isConfirmValid || !acknowledgmentChecked || isLoading}
            >
              {isLoading ? (
                <>
                  <svg className={styles.loadingSpinner} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3"/>
                    <path d="M4 12a8 8 0 0 1 8-8V2.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                  Deleting Account...
                </>
              ) : (
                'Delete Account Permanently'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}