// src/components/home/RegulationPanel/DeleteModal.js
'use client';

import { useState } from 'react';
import styles from './DeleteModal.module.css';

export default function DeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  conversationTitle,
  isDeleting = false 
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.warningIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className={styles.modalText}>
            <h3 className={styles.modalTitle}>Delete Regulation Query</h3>
            <p className={styles.modalDescription}>
              Are you sure you want to delete "{conversationTitle}"? This will permanently remove all regulation queries and answers in this conversation. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={styles.deleteButton}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className={styles.loadingSpinner}></div>
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}