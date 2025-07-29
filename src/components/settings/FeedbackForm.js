// src/components/settings/FeedbackForm.js
import { useState } from 'react';
import styles from './FeedbackForm.module.css';

export default function FeedbackForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    allowContact: false
  });
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('allowContact', formData.allowContact);
      
      // Add files to FormData
      files.forEach((file, index) => {
        submitData.append(`file_${index}`, file);
      });

      // TODO: Replace with actual API endpoint
      // const response = await fetch('/api/feedback', {
      //   method: 'POST',
      //   body: submitData,
      // });

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Feedback submitted:', {
        ...formData,
        files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
      });
      
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        allowContact: false
      });
      setFiles([]);
      
      // Clear file input
      const fileInput = document.getElementById('file_upload');
      if (fileInput) fileInput.value = '';
      
      alert('Thank you for your feedback! We\'ll review it and get back to you if needed.');
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('There was an error submitting your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className={styles.feedbackForm}>
      <h2 className={styles.mainHeading}>Send Feedback</h2>
      <p className={styles.description}>
        Help us improve AI CAD by sharing your thoughts, reporting bugs, or suggesting new features.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            Title <span className={styles.required}>*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="Brief summary of your feedback"
            value={formData.title}
            onChange={handleChange}
            className={styles.input}
            required
            maxLength={100}
          />
          <small className={styles.helpText}>
            {formData.title.length}/100 characters
          </small>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            Description <span className={styles.required}>*</span>
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="Please describe your feedback, bug report, or feature request in detail. Include steps to reproduce if reporting a bug."
            value={formData.description}
            onChange={handleChange}
            className={styles.textarea}
            rows="6"
            required
            maxLength={2000}
          ></textarea>
          <small className={styles.helpText}>
            {formData.description.length}/2000 characters
          </small>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Attach files (optional)</label>
          <div className={styles.fileUpload}>
            <input
              type="file"
              id="file_upload"
              onChange={handleFileChange}
              multiple
              accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx,.svg"
              className={styles.fileInput}
            />
            <label htmlFor="file_upload" className={styles.fileButton}>
              {/* Upload SVG Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Choose files</span>
            </label>
            {files.length > 0 && (
              <div className={styles.fileList}>
                <span className={styles.fileCount}>
                  {files.length} file(s) selected
                </span>
                <div className={styles.selectedFiles}>
                  {files.map((file, index) => (
                    <div key={index} className={styles.fileItem}>
                      <span className={styles.fileName}>
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className={styles.removeFile}
                        title="Remove file"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <small className={styles.helpText}>
            Accepted formats: Images (JPG, PNG, GIF), Documents (PDF, TXT, DOC), SVG files. Max 10MB per file.
          </small>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.checkboxContainer}>
            <input
              type="checkbox"
              name="allowContact"
              checked={formData.allowContact}
              onChange={handleChange}
              className={styles.checkbox}
            />
            <span className={styles.checkboxLabel}>
              I agree to be contacted for follow-up questions about this feedback
            </span>
          </label>
        </div>
        
        <div className={styles.privacyInfo}>
          <p className={styles.privacyText}>
            Your feedback helps us improve AI CAD. We may use your input to enhance our features and fix bugs. 
            If you've opted in above, we may contact you for clarification. We respect your privacy and handle 
            all feedback according to our Privacy Policy.
          </p>
        </div>
        
        <div className={styles.submitContainer}>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
          >
            {isSubmitting ? (
              <>
                <svg className={styles.loadingSpinner} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3"/>
                  <path d="M4 12a8 8 0 0 1 8-8V2.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}