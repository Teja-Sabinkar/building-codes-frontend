// components/legal/TermsModal.js
'use client';

import { useEffect } from 'react';
import styles from './LegalModal.module.css';

export default function TermsModal({ isOpen, onClose }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Terms of Service</h2>
          <button 
            onClick={onClose} 
            className={styles.closeButton}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalBody}>
          <div className={styles.contentWrapper}>
            
            <p className={styles.lastUpdated}>Last Updated: February 5, 2026</p>

            <section className={styles.section}>
              <h3>1. Acceptance of Terms</h3>
              <p>Welcome to REG-GPT ("we," "our," or "the Service"). By creating an account or using REG-GPT, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.</p>
            </section>

            <section className={styles.section}>
              <h3>2. Service Description</h3>
              
              <h4>2.1 What REG-GPT Provides</h4>
              <p>REG-GPT is an AI-powered building codes assistant that provides information based on official building regulations, including:</p>
              <ul>
                <li>India: National Building Code (NBC) 2016</li>
                <li>Scotland: Building Standards Technical Handbooks (January 2025)</li>
                <li>Dubai: Dubai Building Code English Edition 2021</li>
              </ul>

              <p>The Service includes:</p>
              <ul>
                <li>AI-generated responses using Claude API technology</li>
                <li>Citations to official building code documents</li>
                <li>PDF viewing of building regulations</li>
                <li>Conversation history and recently viewed documents</li>
                <li>Region-specific building code information</li>
              </ul>

              <h4>2.2 Important Limitations</h4>
              <p><strong>REG-GPT IS NOT:</strong></p>
              <ul>
                <li>A replacement for professional architectural or engineering consultation</li>
                <li>A substitute for official building control approval</li>
                <li>Legal advice or regulatory compliance certification</li>
                <li>A guarantee of building code accuracy or completeness</li>
              </ul>

              <p><strong>YOU MUST:</strong></p>
              <ul>
                <li>Verify all information with licensed professionals</li>
                <li>Consult official building control authorities for approvals</li>
                <li>Use professional judgment in applying regulations</li>
                <li>Check for local amendments and updated regulations</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>3. User Accounts and Registration</h3>
              
              <h4>3.1 Account Requirements</h4>
              <p>To use REG-GPT, you must:</p>
              <ul>
                <li>Be at least 18 years of age</li>
                <li>Provide accurate and complete registration information (name, email, password)</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>

              <h4>3.2 Account Responsibility</h4>
              <p>You are responsible for:</p>
              <ul>
                <li>All activities that occur under your account</li>
                <li>Maintaining the confidentiality of your password</li>
                <li>Ensuring your account information is current and accurate</li>
              </ul>

              <h4>3.3 One Account Per Person</h4>
              <p>Each user may maintain only one account. Creating multiple accounts may result in suspension or termination of all accounts.</p>
            </section>

            <section className={styles.section}>
              <h3>4. Acceptable Use Policy</h3>
              
              <h4>4.1 Permitted Uses</h4>
              <p>You MAY use REG-GPT to:</p>
              <ul>
                <li>Access building code information for professional purposes</li>
                <li>Use citations in professional reports (with proper attribution)</li>
                <li>Reference building regulations for architecture and engineering projects</li>
                <li>Access the Service across multiple devices</li>
                <li>View and review PDFs of building codes</li>
                <li>Use for commercial projects without restrictions</li>
              </ul>

              <h4>4.2 Prohibited Uses</h4>
              <p>You MAY NOT:</p>
              <ul>
                <li>Share your account credentials with others</li>
                <li>Scrape, download, or extract bulk data from the Service</li>
                <li>Reverse engineer, decompile, or disassemble the Service</li>
                <li>Use the Service for illegal purposes or to violate regulations</li>
                <li>Resell, redistribute, or create derivative works from the Service</li>
                <li>Use AI-generated output as final legal/professional advice without verification</li>
                <li>Submit malicious queries or attempt to abuse the system</li>
                <li>Use automated tools or bots without authorization</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Impersonate others or misrepresent your affiliation</li>
              </ul>

              <h4>4.3 Enforcement</h4>
              <p>Violation of these Terms may result in:</p>
              <ul>
                <li>Warning and request to cease prohibited activity</li>
                <li>Temporary suspension of account access</li>
                <li>Permanent termination of account</li>
                <li>Legal action if warranted</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>5. Subscription and Pricing</h3>
              
              <h4>5.1 Free Access</h4>
              <p>REG-GPT is currently offered as a <strong>free service</strong> with:</p>
              <ul>
                <li>No subscription fees</li>
                <li>No usage limits or API restrictions</li>
                <li>Full access to all features and building codes</li>
                <li>Free access for both personal and commercial use</li>
              </ul>

              <h4>5.2 Future Changes</h4>
              <p>We reserve the right to:</p>
              <ul>
                <li>Introduce paid subscription tiers in the future</li>
                <li>Modify pricing with at least 30 days' notice</li>
                <li>Grandfather existing users under current terms (where reasonable)</li>
              </ul>
              <p>If paid subscriptions are introduced, these Terms will be updated accordingly.</p>
            </section>

            <section className={styles.section}>
              <h3>6. Intellectual Property</h3>
              
              <h4>6.1 REG-GPT Platform</h4>
              <p>The REG-GPT platform, including its software, design, branding, and user interface, is owned by us and protected by intellectual property laws. All rights reserved.</p>

              <h4>6.2 Building Code Content</h4>
              <p>Building code documents (NBC 2016, Scottish Building Standards, Dubai Building Code) are:</p>
              <ul>
                <li>Owned by their respective governmental authorities</li>
                <li>Made available under public domain or licensed terms</li>
                <li>Subject to copyright of the original publishers</li>
                <li>Must be attributed to the original source when cited</li>
              </ul>

              <h4>6.3 AI-Generated Responses</h4>
              <p>Responses generated by REG-GPT using the Claude API are:</p>
              <ul>
                <li>Created based on official building code content</li>
                <li>Subject to Anthropic's terms of service</li>
                <li>Provided "as-is" for informational purposes</li>
                <li>Must include proper attribution when used in reports or documents</li>
              </ul>

              <h4>6.4 User Content</h4>
              <p>You retain ownership of:</p>
              <ul>
                <li>Your queries and questions submitted to the Service</li>
                <li>Your conversation history</li>
                <li>Your account data</li>
              </ul>

              <p>By using the Service, you grant us a license to:</p>
              <ul>
                <li>Store and process your queries to provide responses</li>
                <li>Use anonymized data to improve the Service</li>
                <li>Display your conversation history to you</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>7. Disclaimer of Warranties</h3>
              
              <h4>7.1 "AS IS" Service</h4>
              <p>REG-GPT IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:</p>
              <ul>
                <li>Accuracy, completeness, or reliability of information</li>
                <li>Fitness for a particular purpose</li>
                <li>Merchantability or non-infringement</li>
                <li>Uninterrupted or error-free operation</li>
                <li>Freedom from viruses or harmful components</li>
              </ul>

              <h4>7.2 AI Limitations</h4>
              <p><strong>IMPORTANT NOTICE REGARDING AI TECHNOLOGY:</strong></p>
              <p>The Service uses artificial intelligence (Claude API) which has inherent limitations:</p>
              <ul>
                <li>AI May Generate Errors: The AI may produce incorrect, incomplete, or outdated information</li>
                <li>Hallucinations Possible: The AI may create plausible-sounding but factually incorrect responses</li>
                <li>Misinterpretation Risk: Building code context may be misunderstood or misapplied</li>
                <li>No Guarantee of Accuracy: We do not guarantee that AI responses are correct</li>
              </ul>

              <p><strong>YOU MUST ALWAYS:</strong></p>
              <ul>
                <li>Verify information with official building code documents</li>
                <li>Consult licensed professionals for technical decisions</li>
                <li>Use professional judgment in applying regulations</li>
                <li>Cross-reference citations with source documents</li>
              </ul>

              <h4>7.3 Building Code Currency</h4>
              <p><strong>BUILDING CODES ARE SUBJECT TO CHANGE:</strong></p>
              <ul>
                <li>Regulations may be updated, amended, or superseded</li>
                <li>Local jurisdictions may have specific amendments</li>
                <li>The Service may not reflect the most current version</li>
                <li>Regional variations and exceptions may apply</li>
              </ul>

              <p><strong>YOU ARE RESPONSIBLE FOR:</strong></p>
              <ul>
                <li>Verifying current building code versions</li>
                <li>Checking for local amendments and variations</li>
                <li>Ensuring compliance with applicable regulations</li>
                <li>Obtaining official approvals from building control authorities</li>
              </ul>

              <h4>7.4 System Availability</h4>
              <p>We do not guarantee that:</p>
              <ul>
                <li>The Service will be available 24/7 without interruption</li>
                <li>Data will never be lost or corrupted</li>
                <li>The Service will meet your specific requirements</li>
                <li>Errors or defects will be corrected</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>8. Limitation of Liability</h3>
              
              <h4>8.1 No Liability for Professional Decisions</h4>
              <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:</p>
              <ul>
                <li>Decisions made based on information provided by the Service</li>
                <li>Project delays, cost overruns, or construction failures</li>
                <li>Regulatory non-compliance or failed building inspections</li>
                <li>Structural failures, safety issues, or property damage</li>
                <li>Loss of data, profits, or business opportunities</li>
                <li>Service interruptions or unavailability</li>
                <li>Errors in AI-generated responses or citations</li>
                <li>Reliance on outdated or incorrect building code information</li>
              </ul>

              <h4>8.2 Types of Damages Excluded</h4>
              <p>We are not liable for any:</p>
              <ul>
                <li>Direct, indirect, incidental, or consequential damages</li>
                <li>Special, exemplary, or punitive damages</li>
                <li>Loss of use, data, business, or profits</li>
                <li>Cost of substitute services</li>
              </ul>

              <h4>8.3 User Responsibility</h4>
              <p><strong>YOU ACKNOWLEDGE AND AGREE THAT:</strong></p>
              <ul>
                <li>You use the Service entirely at your own risk</li>
                <li>You are responsible for all professional decisions and outcomes</li>
                <li>You must verify all information with qualified professionals</li>
                <li>You must obtain appropriate professional insurance and approvals</li>
              </ul>

              <h4>8.4 Indemnification</h4>
              <p>You agree to indemnify, defend, and hold harmless REG-GPT, its owners, employees, and affiliates from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:</p>
              <ul>
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any laws or regulations</li>
                <li>Your infringement of any third-party rights</li>
                <li>Decisions made based on information from the Service</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>9. Data Usage and Privacy</h3>
              
              <h4>9.1 Data Collection</h4>
              <p>We collect and store:</p>
              <ul>
                <li>Account information (name, email, password)</li>
                <li>Queries and conversation history</li>
                <li>Recently viewed documents and page numbers</li>
                <li>Usage patterns and interaction data</li>
              </ul>

              <h4>9.2 How We Use Your Data</h4>
              <p>Your data is used to:</p>
              <ul>
                <li>Provide the Service and generate AI responses</li>
                <li>Maintain your conversation history</li>
                <li>Track recently viewed documents</li>
                <li>Improve Service quality and AI response accuracy</li>
                <li>Send service updates and important notifications</li>
                <li>Ensure system security and prevent abuse</li>
              </ul>

              <h4>9.3 Third-Party Services</h4>
              <p>We use third-party services including:</p>
              <ul>
                <li>Anthropic (Claude API): To process queries and generate AI responses</li>
                <li>MongoDB Atlas: To store user data and conversation history</li>
                <li>Vercel: For frontend hosting</li>
                <li>Render: For backend API hosting</li>
                <li>Email Services: For account verification and password resets</li>
              </ul>

              <h4>9.4 Privacy Policy</h4>
              <p>For detailed information about how we collect, use, and protect your data, please review our <strong>Privacy Policy</strong> (available alongside these Terms).</p>

              <h4>9.5 Email Communications</h4>
              <p>By using REG-GPT, you agree to receive:</p>
              <ul>
                <li>Account verification emails (required)</li>
                <li>Password reset emails (required)</li>
                <li>Service updates and feature announcements (optional - you may opt out)</li>
                <li>Important security or legal notices (required)</li>
              </ul>
              <p>You may opt out of non-essential emails through your account settings or by clicking "unsubscribe" in any email.</p>
            </section>

            <section className={styles.section}>
              <h3>10. Account Termination</h3>
              
              <h4>10.1 Termination by You</h4>
              <p>You may close your account at any time by:</p>
              <ul>
                <li>Accessing account settings and selecting "Delete Account"</li>
                <li>Contacting us at teja@reggpt.uk</li>
              </ul>

              <p>Upon account closure:</p>
              <ul>
                <li>Your access to the Service will be immediately terminated</li>
                <li>Your data will be deleted within 30 days (see Data Retention below)</li>
                <li>You may request a copy of your data before deletion</li>
              </ul>

              <h4>10.2 Termination by Us</h4>
              <p>We reserve the right to suspend or terminate your account if:</p>
              <ul>
                <li>You violate these Terms of Service</li>
                <li>Your account has been inactive for 12 months</li>
                <li>We suspect fraudulent or abusive activity</li>
                <li>Required by law or regulatory authorities</li>
                <li>We discontinue the Service (with 30 days' notice)</li>
              </ul>

              <h4>10.3 Data Retention After Termination</h4>
              <ul>
                <li>Active Accounts: Data retained indefinitely while account is active</li>
                <li>Inactive Accounts: Accounts inactive for 12 months may be deleted</li>
                <li>Deleted Accounts: Data removed within 30 days of deletion request</li>
                <li>Backups: Backup copies deleted within 90 days</li>
              </ul>
              <p>You may request a copy of your data before account deletion.</p>
            </section>

            <section className={styles.section}>
              <h3>11. Modifications to Terms</h3>
              
              <h4>11.1 Right to Modify</h4>
              <p>We reserve the right to modify these Terms at any time. When we make changes:</p>
              <ul>
                <li>We will update the "Last Updated" date at the top of this document</li>
                <li>We will notify you via email and/or prominent notice on the Service</li>
                <li>Material changes will be announced at least 30 days in advance</li>
                <li>Your continued use of the Service after changes constitutes acceptance</li>
              </ul>

              <h4>11.2 Notification of Changes</h4>
              <p>You will be notified of Terms changes through:</p>
              <ul>
                <li>Email to your registered email address</li>
                <li>Banner notification when you log in</li>
                <li>Notice on the landing page</li>
              </ul>

              <h4>11.3 Disagreement with Changes</h4>
              <p>If you do not agree to modified Terms:</p>
              <ul>
                <li>You must stop using the Service</li>
                <li>You may close your account before changes take effect</li>
                <li>The previous Terms will apply until the effective date of changes</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>12. Governing Law and Disputes</h3>
              
              <h4>12.1 Governing Law</h4>
              <p>These Terms are governed by the laws of the United Kingdom, without regard to conflict of law principles.</p>

              <h4>12.2 Jurisdiction</h4>
              <p>Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the courts of the United Kingdom.</p>

              <h4>12.3 Language</h4>
              <p>These Terms are written in English. Any translations are for convenience only, and the English version shall prevail in case of discrepancies.</p>

              <h4>12.4 Dispute Resolution</h4>
              <p>Before pursuing legal action, we encourage you to:</p>
              <ol>
                <li>Contact us to resolve the issue informally</li>
                <li>Provide a detailed description of the dispute</li>
                <li>Allow 30 days for us to respond and attempt resolution</li>
              </ol>

              <h4>12.5 Severability</h4>
              <p>If any provision of these Terms is found to be unenforceable or invalid:</p>
              <ul>
                <li>That provision shall be modified to the minimum extent necessary</li>
                <li>All other provisions shall remain in full force and effect</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>13. Miscellaneous</h3>
              
              <h4>13.1 Entire Agreement</h4>
              <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and REG-GPT regarding the Service.</p>

              <h4>13.2 Waiver</h4>
              <p>Our failure to enforce any provision of these Terms does not constitute a waiver of that provision or any other provision.</p>

              <h4>13.3 Assignment</h4>
              <p>You may not assign or transfer these Terms or your account without our written consent. We may assign these Terms without restriction.</p>

              <h4>13.4 Third-Party Beneficiaries</h4>
              <p>These Terms do not create any third-party beneficiary rights.</p>

              <h4>13.5 Force Majeure</h4>
              <p>We are not liable for any failure to perform due to circumstances beyond our reasonable control, including natural disasters, wars, pandemics, internet disruptions, or actions by third-party service providers.</p>
            </section>

            <section className={styles.section}>
              <h3>14. Contact Information</h3>
              <p>If you have questions about these Terms of Service, please contact us at:</p>
              <p><strong>REG-GPT Support</strong><br/>
              Email: teja@reggpt.uk<br/>
              Website: https://www.reggpt.uk/</p>
            </section>

            <section className={styles.section}>
              <h3>15. Acknowledgment</h3>
              <p><strong>BY CREATING AN ACCOUNT OR USING REG-GPT, YOU ACKNOWLEDGE THAT:</strong></p>
              <ul>
                <li>You have read and understood these Terms of Service</li>
                <li>You agree to be bound by these Terms</li>
                <li>You are at least 18 years of age</li>
                <li>You understand the limitations and disclaimers outlined above</li>
                <li>You will verify all information with qualified professionals</li>
                <li>You will not rely solely on AI-generated responses for professional decisions</li>
                <li>You accept responsibility for decisions made using the Service</li>
              </ul>
            </section>

            <div className={styles.footer}>
              <p>Thank you for using REG-GPT. We are committed to providing a valuable tool for accessing building code information, while emphasizing the importance of professional verification and judgment in all architectural and engineering decisions.</p>
              <p className={styles.effective}>These Terms of Service are effective as of the "Last Updated" date shown above.</p>
            </div>

          </div>
        </div>

        {/* Footer with Close Button */}
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.acceptButton}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}