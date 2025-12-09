// src/components/home/RegulationPanel/FeedbackModal.js
'use client';

import { useState } from 'react';
import styles from './FeedbackModal.module.css';

export default function FeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  feedbackType, // 'helpful' or 'unhelpful'
  messageId
}) {
  const [selectedIssue, setSelectedIssue] = useState('');
  const [detailsText, setDetailsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Issue types for unhelpful feedback dropdown
  const issueTypes = [
    'UI bug',
    'Did not fully follow my request',
    'Not factually correct',
    'Incomplete response',
    'Report content',
    'Other'
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Prepare feedback data
    const feedbackData = {
      messageId,
      feedbackType,
      details: detailsText.trim(),
      ...(feedbackType === 'unhelpful' && selectedIssue && { issueType: selectedIssue })
    };

    console.log('📝 Submitting feedback:', feedbackData);

    // Call parent onSubmit handler
    await onSubmit(feedbackData);

    // Reset form
    setSelectedIssue('');
    setDetailsText('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    // Reset form state
    setSelectedIssue('');
    setDetailsText('');
    setIsSubmitting(false);
    onClose();
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop, not the modal content
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Feedback</h2>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {/* Dropdown for unhelpful feedback */}
          {feedbackType === 'unhelpful' && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                What type of issue do you wish to report? (optional)
              </label>
              <div className={styles.selectWrapper}>
                <select
                  value={selectedIssue}
                  onChange={(e) => setSelectedIssue(e.target.value)}
                  className={styles.selectInput}
                  disabled={isSubmitting}
                >
                  <option value="">Select...</option>
                  {issueTypes.map((issueType, index) => (
                    <option key={index} value={issueType}>
                      {issueType}
                    </option>
                  ))}
                </select>
                <svg 
                  className={styles.selectIcon} 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Text area for details */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Please provide details: (optional)
            </label>
            <textarea
              value={detailsText}
              onChange={(e) => setDetailsText(e.target.value)}
              placeholder={
                feedbackType === 'helpful'
                  ? 'What was satisfying about this response?'
                  : 'What was unsatisfying about this response?'
              }
              className={styles.textareaInput}
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          {/* Footer disclaimer */}
          <div className={styles.modalFooterText}>
            Submitting this report will help improve REG-GPT's building code responses.
          </div>
        </div>

        {/* Action buttons */}
        <div className={styles.modalActions}>
          <button
            onClick={handleSubmit}
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button
            onClick={handleClose}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}