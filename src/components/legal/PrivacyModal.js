// components/legal/PrivacyModal.js
'use client';

import { useEffect } from 'react';
import styles from './LegalModal.module.css';

export default function PrivacyModal({ isOpen, onClose }) {
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
          <h2 className={styles.modalTitle}>Privacy Policy</h2>
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
              <h3>Introduction</h3>
              <p>Welcome to REG-GPT's Privacy Policy. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our AI-powered building codes assistant service.</p>
              
              <p><strong>Key Principles:</strong></p>
              <ul>
                <li>We collect only necessary data to provide the Service</li>
                <li>We are transparent about how data is used</li>
                <li>We protect your data with industry-standard security</li>
                <li>You have control over your data and privacy choices</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>1. Information We Collect</h3>
              <p>We collect several types of information to provide and improve our Service.</p>

              <h4>1.1 Personal Information (Account Data)</h4>
              <p>When you create an account, we collect:</p>
              <ul>
                <li><strong>Full Name:</strong> Account identification (Required)</li>
                <li><strong>Email Address:</strong> Account access, verification, communications (Required)</li>
                <li><strong>Password:</strong> Account security - stored as hashed value, never plain text (Required)</li>
                <li><strong>Account Creation Date:</strong> Service records (Auto-collected)</li>
                <li><strong>Last Login Timestamp:</strong> Security monitoring (Auto-collected)</li>
              </ul>
              <p><strong>Note:</strong> We do NOT collect credit card information (service is currently free).</p>

              <h4>1.2 Usage Data (Service Interaction)</h4>
              <p>While you use REG-GPT, we automatically collect:</p>
              
              <p><strong>Query and Conversation Data:</strong></p>
              <ul>
                <li>Questions and queries you submit to the Service</li>
                <li>AI-generated responses from Claude API</li>
                <li>Complete conversation history (stored in your account)</li>
                <li>Timestamps of each interaction</li>
                <li>Building code regions selected (India, Scotland, Dubai)</li>
              </ul>

              <p><strong>Document Viewing Data:</strong></p>
              <ul>
                <li>PDFs viewed through the Service</li>
                <li>Page numbers viewed in each document</li>
                <li>Recently viewed documents list (per region - max 10 per region)</li>
                <li>Time spent viewing documents</li>
                <li>Citations clicked and referenced</li>
              </ul>

              <p><strong>Navigation and Feature Usage:</strong></p>
              <ul>
                <li>Search patterns and query types</li>
                <li>Features used (PDF viewer, region selector, etc.)</li>
                <li>Navigation paths through the Service</li>
                <li>Settings and preferences</li>
              </ul>

              <h4>1.3 Technical Data (System Information)</h4>
              <p>To ensure Service quality and security, we collect:</p>
              <ul>
                <li><strong>IP Address:</strong> Security, fraud prevention</li>
                <li><strong>Device Type:</strong> Optimize user experience (Desktop, Mobile, Tablet)</li>
                <li><strong>Browser Information:</strong> Compatibility, bug fixes</li>
                <li><strong>Operating System:</strong> Technical support</li>
                <li><strong>Screen Resolution:</strong> UI optimization</li>
                <li><strong>Referrer URL:</strong> Understand user sources</li>
              </ul>

              <h4>1.4 AI Interaction Data</h4>
              <p><strong>Claude API Processing:</strong></p>
              <ul>
                <li>Full text of queries sent to Anthropic's Claude API</li>
                <li>Building code context provided to the AI</li>
                <li>AI-generated response content</li>
                <li>Search results and relevance scores</li>
                <li>Response generation times and performance metrics</li>
                <li>Citations and references generated</li>
              </ul>
              <p><strong>Important:</strong> Queries are also subject to Anthropic's Privacy Policy. Anthropic may use interaction data to improve Claude unless you are on an Enterprise tier.</p>

              <h4>1.5 Cookies and Local Storage</h4>
              <p>We use the following storage mechanisms:</p>
              <ul>
                <li><strong>authToken:</strong> Authentication (JWT) - Essential - Session/Remember Me</li>
                <li><strong>regGPT-guestTheme:</strong> Theme preference (light/dark) - Functional - Persistent</li>
                <li><strong>Session Cookie:</strong> Maintain login state - Essential - Session</li>
              </ul>
              <p><strong>Essential Cookies:</strong> Required for the Service to function (cannot be disabled)</p>
              <p><strong>Functional Cookies:</strong> Enhance user experience (can be controlled through settings)</p>
            </section>

            <section className={styles.section}>
              <h3>2. How We Use Your Information</h3>
              <p>Your data is used exclusively for the purposes outlined below:</p>

              <h4>2.1 Service Delivery</h4>
              <p><strong>To Provide Core Functionality:</strong></p>
              <ul>
                <li>Generate AI responses to your building code queries</li>
                <li>Display relevant citations from official building regulations</li>
                <li>Maintain your conversation history across sessions</li>
                <li>Track recently viewed documents for quick access</li>
                <li>Remember your region preferences</li>
                <li>Deliver region-specific building code information</li>
              </ul>

              <h4>2.2 Account Management</h4>
              <p><strong>To Manage Your Account:</strong></p>
              <ul>
                <li>Authenticate your identity using JWT tokens</li>
                <li>Verify your email address during registration</li>
                <li>Process password reset requests</li>
                <li>Monitor for suspicious or unauthorized access</li>
                <li>Prevent account sharing and abuse</li>
                <li>Provide customer support when requested</li>
              </ul>

              <h4>2.3 Service Improvement</h4>
              <p><strong>To Enhance REG-GPT Quality:</strong></p>
              <ul>
                <li>Analyze query patterns to improve AI response relevance</li>
                <li>Identify common questions to enhance search algorithms</li>
                <li>Detect and fix bugs or technical issues</li>
                <li>Optimize system performance and response times</li>
                <li>Develop new features based on usage patterns</li>
                <li>Improve building code citation accuracy</li>
              </ul>
              <p><strong>Anonymization:</strong> When used for improvement, data is typically anonymized (personally identifiable information removed).</p>

              <h4>2.4 Communication</h4>
              <p><strong>To Keep You Informed:</strong></p>
              <ul>
                <li>Send account verification emails (required)</li>
                <li>Send password reset links (required)</li>
                <li>Notify about service updates and new features</li>
                <li>Announce new building code additions (India, Scotland, Dubai expansions)</li>
                <li>Alert about important security or policy changes</li>
                <li>Respond to support inquiries</li>
              </ul>

              <p><strong>Email Preferences:</strong></p>
              <ul>
                <li><strong>Required Emails:</strong> Account security, verification, critical service notices</li>
                <li><strong>Optional Emails:</strong> Feature updates, tips, newsletters (you may opt out anytime)</li>
              </ul>

              <h4>2.5 Security and Compliance</h4>
              <p><strong>To Protect Users and the Service:</strong></p>
              <ul>
                <li>Prevent fraud, abuse, and unauthorized access</li>
                <li>Enforce our Terms of Service</li>
                <li>Comply with legal obligations and regulatory requirements</li>
                <li>Protect against security vulnerabilities</li>
                <li>Investigate suspected violations</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>3. Data Storage and Security</h3>

              <h4>3.1 Where Your Data is Stored</h4>
              <p>Your data is stored across multiple secure platforms:</p>
              <ul>
                <li><strong>User Accounts:</strong> MongoDB Atlas (Cloud, Multi-region)</li>
                <li><strong>Conversation History:</strong> MongoDB Atlas (Cloud, Multi-region)</li>
                <li><strong>Recently Viewed PDFs:</strong> MongoDB Atlas (Cloud, Multi-region)</li>
                <li><strong>Frontend Application:</strong> Vercel Edge Network (Global CDN)</li>
                <li><strong>Backend API:</strong> Render Cloud (US/EU Regions)</li>
                <li><strong>AI Processing:</strong> Claude API by Anthropic (US-based)</li>
                <li><strong>Building Code PDFs:</strong> Backend Server (Self-hosted)</li>
              </ul>

              <h4>3.2 Security Measures</h4>
              <p>We implement industry-standard security practices:</p>

              <p><strong>Authentication & Access Control:</strong></p>
              <ul>
                <li>Passwords hashed using bcrypt (never stored in plain text)</li>
                <li>JWT (JSON Web Tokens) for secure authentication</li>
                <li>Session management with automatic expiration</li>
                <li>Role-based access control</li>
                <li>Multi-factor authentication available (if implemented)</li>
              </ul>

              <p><strong>Data Transmission Security:</strong></p>
              <ul>
                <li>HTTPS/TLS 1.3 encryption for all data in transit</li>
                <li>Secure MongoDB connections with encryption</li>
                <li>API requests encrypted end-to-end</li>
                <li>Secure WebSocket connections (if applicable)</li>
              </ul>

              <p><strong>Infrastructure Security:</strong></p>
              <ul>
                <li>Regular security updates and patches</li>
                <li>Firewall protection and DDoS mitigation</li>
                <li>Intrusion detection monitoring</li>
                <li>Regular security audits and vulnerability scanning</li>
                <li>Isolated database environments</li>
                <li>Backup encryption and secure storage</li>
              </ul>

              <p><strong>Application Security:</strong></p>
              <ul>
                <li>Input validation and sanitization</li>
                <li>Protection against SQL injection, XSS, CSRF attacks</li>
                <li>Rate limiting to prevent abuse</li>
                <li>Secure session management</li>
                <li>Regular dependency updates</li>
              </ul>

              <h4>3.3 Data Retention</h4>
              <p><strong>How Long We Keep Your Data:</strong></p>
              <ul>
                <li><strong>Active Accounts:</strong> Indefinitely (while active) - Service provision</li>
                <li><strong>Inactive Accounts:</strong> 12 months after last login - Storage optimization</li>
                <li><strong>Deleted Accounts:</strong> 30 days (then permanently deleted) - Grace period for recovery</li>
                <li><strong>Backup Copies:</strong> 90 days after deletion - Disaster recovery</li>
                <li><strong>Anonymized Analytics:</strong> Indefinitely - Service improvement</li>
                <li><strong>Legal Holds:</strong> As required by law - Compliance</li>
              </ul>

              <p><strong>Automatic Deletion:</strong></p>
              <ul>
                <li>Accounts inactive for 12 months may be automatically deleted</li>
                <li>You will receive email warnings at 10 months and 11 months before deletion</li>
                <li>You can prevent deletion by logging in</li>
              </ul>

              <p><strong>User-Initiated Deletion:</strong></p>
              <ul>
                <li>Request account deletion through Settings → Delete Account</li>
                <li>Data removal begins immediately</li>
                <li>Complete deletion within 30 days</li>
                <li>Backup copies removed within 90 days</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>4. Data Sharing and Third Parties</h3>

              <h4>4.1 Third-Party Service Providers</h4>
              <p>We share data with trusted third parties to operate the Service:</p>

              <p><strong>Anthropic (Claude API)</strong></p>
              <ul>
                <li>Purpose: AI response generation</li>
                <li>Data Shared: Your queries, building code context, conversation history</li>
                <li>Privacy: Subject to Anthropic's Privacy Policy</li>
                <li>Note: Anthropic may use data to improve Claude (unless Enterprise tier)</li>
              </ul>

              <p><strong>MongoDB Atlas</strong></p>
              <ul>
                <li>Purpose: Database hosting and management</li>
                <li>Data Shared: All user data (accounts, conversations, preferences)</li>
                <li>Privacy: Subject to MongoDB Privacy Policy</li>
              </ul>

              <p><strong>Vercel</strong></p>
              <ul>
                <li>Purpose: Frontend application hosting</li>
                <li>Data Shared: Web traffic, frontend logs, CDN access</li>
                <li>Privacy: Subject to Vercel Privacy Policy</li>
              </ul>

              <p><strong>Render</strong></p>
              <ul>
                <li>Purpose: Backend API hosting</li>
                <li>Data Shared: API requests, backend logs, system metrics</li>
                <li>Privacy: Subject to Render Privacy Policy</li>
              </ul>

              <p><strong>Email Service Provider</strong></p>
              <ul>
                <li>Purpose: Send verification, password reset, and update emails</li>
                <li>Data Shared: Email address, name, email content</li>
                <li>Privacy: Subject to provider's privacy policy (e.g., SendGrid, AWS SES)</li>
              </ul>

              <h4>4.2 What We DO NOT Do</h4>
              <p><strong>We NEVER:</strong></p>
              <ul>
                <li>Sell your personal information to third parties</li>
                <li>Share your data with advertisers or marketing companies</li>
                <li>Use your data for purposes unrelated to the Service</li>
                <li>Share data with competitors or unauthorized parties</li>
                <li>Rent or lease your information</li>
              </ul>

              <h4>4.3 When We MAY Share Data</h4>
              <p>We may share your information only in these limited circumstances:</p>

              <p><strong>Anonymized Aggregated Data:</strong></p>
              <ul>
                <li>Statistical analysis (e.g., "80% of queries are about fire safety")</li>
                <li>Research on building code usage patterns</li>
                <li>Public reports on common architectural questions</li>
                <li>Service improvement metrics</li>
                <li>Note: No personally identifiable information included</li>
              </ul>

              <p><strong>Legal Requirements:</strong></p>
              <ul>
                <li>When required by law, court order, or legal process</li>
                <li>To comply with regulatory investigations</li>
                <li>To protect our legal rights or defend against claims</li>
                <li>To investigate fraud or security incidents</li>
                <li>To protect user safety or prevent harm</li>
              </ul>

              <p><strong>Business Transfers:</strong></p>
              <ul>
                <li>If REG-GPT is acquired or merged with another company</li>
                <li>During due diligence for business transactions</li>
                <li>In bankruptcy or dissolution proceedings</li>
                <li>Note: Acquiring party must honor this Privacy Policy</li>
              </ul>

              <p><strong>With Your Consent:</strong></p>
              <ul>
                <li>Any other sharing will only occur with your explicit permission</li>
                <li>You can withdraw consent at any time</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>5. Your Rights (GDPR Compliance)</h3>
              <p>Under UK GDPR and data protection laws, you have the following rights:</p>

              <h4>5.1 Right to Access</h4>
              <p><strong>You can request:</strong></p>
              <ul>
                <li>A copy of all personal data we hold about you</li>
                <li>Information about how your data is used</li>
                <li>Details about data sharing and processing</li>
              </ul>
              <p><strong>How to exercise:</strong> Email us or use "Download My Data" in account settings</p>
              <p><strong>Response time:</strong> Within 30 days</p>
              <p><strong>Format:</strong> JSON or CSV file</p>

              <h4>5.2 Right to Rectification</h4>
              <p><strong>You can request:</strong></p>
              <ul>
                <li>Correction of inaccurate personal data</li>
                <li>Completion of incomplete information</li>
                <li>Updates to outdated information</li>
              </ul>
              <p><strong>How to exercise:</strong> Update through account settings or contact us</p>
              <p><strong>Response time:</strong> Immediate (self-service) or within 30 days</p>

              <h4>5.3 Right to Erasure ("Right to be Forgotten")</h4>
              <p><strong>You can request:</strong></p>
              <ul>
                <li>Deletion of your account and all associated data</li>
                <li>Removal from our systems and backups</li>
                <li>Cessation of all data processing</li>
              </ul>
              <p><strong>How to exercise:</strong> Settings → Delete Account or email us</p>
              <p><strong>Process:</strong> Deletion begins immediately, completed within 30 days</p>
              <p><strong>Exceptions:</strong> Data required for legal compliance may be retained</p>

              <h4>5.4 Right to Restrict Processing</h4>
              <p><strong>You can request:</strong></p>
              <ul>
                <li>Temporary halt of data processing</li>
                <li>Limit how data is used while disputes are resolved</li>
                <li>Storage only (no active processing)</li>
              </ul>
              <p><strong>How to exercise:</strong> Contact us with specific restrictions</p>
              <p><strong>Response time:</strong> Within 30 days</p>

              <h4>5.5 Right to Data Portability</h4>
              <p><strong>You can request:</strong></p>
              <ul>
                <li>Your data in a structured, machine-readable format</li>
                <li>Transfer of data to another service provider</li>
                <li>Conversation history, queries, and preferences</li>
              </ul>
              <p><strong>How to exercise:</strong> Download through account settings</p>
              <p><strong>Format:</strong> JSON (easily imported into other systems)</p>
              <p><strong>Response time:</strong> Immediate (self-service)</p>

              <h4>5.6 Right to Object</h4>
              <p><strong>You can object to:</strong></p>
              <ul>
                <li>Processing for direct marketing (opt-out of emails)</li>
                <li>Processing based on legitimate interests</li>
                <li>Automated decision-making (if applicable)</li>
              </ul>
              <p><strong>How to exercise:</strong> Email preferences in settings or contact us</p>
              <p><strong>Response time:</strong> Immediate (for marketing) or within 30 days</p>

              <h4>5.7 Right to Withdraw Consent</h4>
              <p><strong>You can withdraw consent for:</strong></p>
              <ul>
                <li>Marketing communications</li>
                <li>Optional data collection</li>
                <li>Third-party data sharing (where consent-based)</li>
              </ul>
              <p><strong>How to exercise:</strong> Account settings or email us</p>
              <p><strong>Effect:</strong> Does not affect processing that occurred before withdrawal</p>

              <h4>5.8 Right to Lodge a Complaint</h4>
              <p>If you believe we have violated your privacy rights:</p>
              <p><strong>UK Data Protection Authority:</strong></p>
              <ul>
                <li>Organization: Information Commissioner's Office (ICO)</li>
                <li>Website: https://ico.org.uk/</li>
                <li>Phone: 0303 123 1113</li>
                <li>Address: Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF</li>
              </ul>
              <p>You can also contact us first to resolve issues informally.</p>
            </section>

            <section className={styles.section}>
              <h3>6. How to Exercise Your Rights</h3>

              <p><strong>Contact Methods:</strong></p>
              <p>Email: teja@reggpt.uk<br/>
              Subject Line: "GDPR Data Request - [Your Name]"<br/>
              Include: Your registered email, specific request, account details</p>

              <p><strong>Account Settings:</strong></p>
              <ul>
                <li>Navigate to Settings → Privacy</li>
                <li>Use "Download My Data", "Delete Account", or "Email Preferences"</li>
              </ul>

              <p><strong>Response Timeline:</strong></p>
              <ul>
                <li>Self-service: Immediate</li>
                <li>Email requests: Within 30 days</li>
                <li>Complex requests: May extend to 60 days (we'll notify you)</li>
              </ul>

              <p><strong>Verification:</strong></p>
              <ul>
                <li>We may request identity verification to protect your data</li>
                <li>Acceptable verification: Email confirmation, security questions</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>7. International Data Transfers</h3>

              <h4>7.1 Cross-Border Data Processing</h4>
              <p><strong>Your data may be transferred internationally:</strong></p>
              <ul>
                <li>MongoDB Atlas: Multi-region cloud (EU, US, other regions)</li>
                <li>Anthropic Claude API: United States</li>
                <li>Vercel CDN: Global edge network</li>
                <li>Render: US and EU regions</li>
              </ul>

              <h4>7.2 Safeguards for International Transfers</h4>
              <p>We ensure adequate protection through:</p>
              <ul>
                <li>Standard Contractual Clauses (SCCs) approved by UK/EU authorities</li>
                <li>Service provider certifications and compliance</li>
                <li>Encryption during transit and at rest</li>
                <li>Contractual obligations for data protection</li>
              </ul>

              <h4>7.3 UK GDPR Compliance</h4>
              <p>We comply with:</p>
              <ul>
                <li>UK Data Protection Act 2018</li>
                <li>UK General Data Protection Regulation (UK GDPR)</li>
                <li>International data transfer requirements</li>
                <li>Data adequacy decisions</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>8. Children's Privacy</h3>

              <h4>8.1 Age Restriction</h4>
              <p><strong>REG-GPT is NOT intended for children:</strong></p>
              <ul>
                <li>Service requires users to be 18 years or older</li>
                <li>We do not knowingly collect data from anyone under 18</li>
                <li>Professional service targeting architecture firms and professionals</li>
              </ul>

              <h4>8.2 Parental Safeguards</h4>
              <p><strong>If we discover a user under 18:</strong></p>
              <ul>
                <li>We will immediately suspend the account</li>
                <li>We will delete all collected data</li>
                <li>We will notify the user (if contact possible)</li>
                <li>Parents/guardians can contact us for immediate deletion</li>
              </ul>

              <p><strong>If you believe a minor has used our Service:</strong></p>
              <ul>
                <li>Contact us immediately at teja@reggpt.uk</li>
                <li>Provide account details (if known)</li>
                <li>We will investigate and take appropriate action</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>9. Cookies and Tracking Technologies</h3>

              <h4>9.1 Cookies We Use</h4>
              <p><strong>Essential Cookies (Cannot be Disabled):</strong></p>
              <ul>
                <li><strong>authToken:</strong> JWT authentication token to keep you logged in (Session or "Remember Me" period)</li>
                <li><strong>session_id:</strong> Maintain active session state (Session - cleared on browser close)</li>
              </ul>

              <p><strong>Functional Cookies (Enhance Experience):</strong></p>
              <ul>
                <li><strong>regGPT-guestTheme:</strong> Remember light/dark mode preference (Persistent until changed or cleared)</li>
              </ul>

              <h4>9.2 Local Storage</h4>
              <p>We use browser local storage for:</p>
              <ul>
                <li>Theme preferences (light/dark mode)</li>
                <li>Recently viewed documents cache (per region)</li>
                <li>Temporary UI state</li>
              </ul>
              <p><strong>Note:</strong> Local storage is client-side only and not transmitted to our servers unless needed for functionality.</p>

              <h4>9.3 Third-Party Cookies</h4>
              <p><strong>We currently DO NOT use:</strong></p>
              <ul>
                <li>Google Analytics</li>
                <li>Advertising cookies</li>
                <li>Social media tracking pixels</li>
                <li>Marketing or remarketing cookies</li>
              </ul>

              <p><strong>Third-party services may set cookies:</strong></p>
              <ul>
                <li>Anthropic (Claude API) - subject to their cookie policy</li>
                <li>MongoDB, Vercel, Render - for infrastructure and CDN</li>
              </ul>

              <h4>9.4 Managing Cookies</h4>
              <p><strong>Browser Controls:</strong></p>
              <ul>
                <li>You can block or delete cookies through browser settings</li>
                <li>Warning: Blocking essential cookies will prevent login and Service access</li>
              </ul>

              <p><strong>Your Options:</strong></p>
              <ul>
                <li>Allow all cookies (recommended for full functionality)</li>
                <li>Block non-essential cookies (theme preference won't save)</li>
                <li>Clear cookies periodically (will require re-login)</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>10. Data Breach Notification</h3>

              <h4>10.1 Our Commitment</h4>
              <p>In the unlikely event of a data breach:</p>

              <p><strong>Within 72 Hours:</strong></p>
              <ul>
                <li>We will notify the Information Commissioner's Office (ICO)</li>
                <li>We will assess the risk to affected users</li>
                <li>We will begin containment and remediation</li>
              </ul>

              <p><strong>User Notification:</strong></p>
              <ul>
                <li>If high risk to your rights and freedoms, we will notify you directly</li>
                <li>Notification will include: nature of breach, affected data, steps we're taking</li>
                <li>Advice on protecting yourself will be provided</li>
              </ul>

              <p><strong>Our Actions:</strong></p>
              <ul>
                <li>Immediate investigation and containment</li>
                <li>Forensic analysis to determine cause</li>
                <li>Implementation of additional safeguards</li>
                <li>Cooperation with authorities</li>
                <li>Transparency about the incident</li>
              </ul>

              <h4>10.2 Your Response</h4>
              <p><strong>If you suspect a breach:</strong></p>
              <ul>
                <li>Change your password immediately</li>
                <li>Enable additional security measures</li>
                <li>Monitor your account for suspicious activity</li>
                <li>Contact us at teja@reggpt.uk</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>11. Changes to This Privacy Policy</h3>

              <h4>11.1 Right to Update</h4>
              <p>We may update this Privacy Policy from time to time to reflect:</p>
              <ul>
                <li>Changes in laws or regulations</li>
                <li>New features or services</li>
                <li>Enhanced security practices</li>
                <li>User feedback and requests</li>
                <li>Business operational changes</li>
              </ul>

              <h4>11.2 Notification of Changes</h4>
              <p><strong>You will be notified via:</strong></p>
              <ul>
                <li>Email to your registered address (for material changes)</li>
                <li>Banner notification when you log in</li>
                <li>"Last Updated" date at the top of this policy</li>
                <li>Announcement on the landing page</li>
              </ul>

              <p><strong>Material Changes:</strong></p>
              <ul>
                <li>Will be announced at least 30 days in advance</li>
                <li>Will require acknowledgment for continued use</li>
                <li>Previous version will be archived and available</li>
              </ul>

              <h4>11.3 Review Responsibility</h4>
              <p><strong>We encourage you to:</strong></p>
              <ul>
                <li>Review this Privacy Policy periodically</li>
                <li>Check the "Last Updated" date</li>
                <li>Contact us with questions or concerns</li>
              </ul>

              <p><strong>Continued Use:</strong></p>
              <ul>
                <li>Using the Service after policy updates means you accept the changes</li>
                <li>If you disagree, you may close your account before changes take effect</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>12. Contact Information</h3>

              <h4>12.1 Privacy Questions</h4>
              <p>For questions about this Privacy Policy or our data practices:</p>
              <p><strong>Privacy Team:</strong><br/>
              Email: teja@reggpt.uk<br/>
              Website: https://www.reggpt.uk/<br/>
              Subject: "Privacy Inquiry - [Your Name]"</p>

              <h4>12.2 Data Requests</h4>
              <p>For GDPR rights requests (access, deletion, rectification):</p>
              <p><strong>Data Protection:</strong><br/>
              Email: teja@reggpt.uk<br/>
              Subject: "GDPR Request - [Specific Right]"<br/>
              Response Time: Within 30 days</p>

              <h4>12.3 Security Issues</h4>
              <p>For security concerns or suspected breaches:</p>
              <p><strong>Security Team:</strong><br/>
              Email: teja@reggpt.uk<br/>
              Subject: "URGENT - Security Issue"<br/>
              Response Time: Within 24 hours for critical issues</p>

              <h4>12.4 General Support</h4>
              <p>For general questions or technical support:</p>
              <p><strong>Support Team:</strong><br/>
              Email: teja@reggpt.uk<br/>
              Subject: "Support Request - [Topic]"</p>
            </section>

            <section className={styles.section}>
              <h3>13. Special Notices for Specific Regions</h3>

              <h4>13.1 United Kingdom Users</h4>
              <p><strong>UK GDPR Compliance:</strong></p>
              <ul>
                <li>We comply fully with UK Data Protection Act 2018</li>
                <li>Your rights are protected under UK GDPR</li>
                <li>You may lodge complaints with the ICO</li>
                <li>UK law governs data processing</li>
              </ul>

              <h4>13.2 European Economic Area (EEA) Users</h4>
              <p><strong>EU GDPR Compliance:</strong></p>
              <ul>
                <li>If you access from EEA countries, EU GDPR applies</li>
                <li>Your rights under EU law are equivalent to UK users</li>
                <li>You may lodge complaints with your local supervisory authority</li>
              </ul>

              <h4>13.3 India Users</h4>
              <p><strong>Indian Privacy Laws:</strong></p>
              <ul>
                <li>We comply with India's Information Technology Act 2000</li>
                <li>Data protection practices align with Digital Personal Data Protection Act (when applicable)</li>
              </ul>

              <h4>13.4 United Arab Emirates (Dubai) Users</h4>
              <p><strong>UAE Privacy Laws:</strong></p>
              <ul>
                <li>We comply with UAE Federal Law No. 45 of 2021 on Personal Data Protection</li>
                <li>Your data rights are protected under UAE law</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>14. Transparency Report</h3>

              <h4>14.1 Data Processing Summary</h4>
              <p>As of Last Update:</p>
              <ul>
                <li>Data Retention: 12 months inactive, 30 days post-deletion</li>
                <li>Third Parties: 5 service providers (MongoDB, Anthropic, Vercel, Render, Email)</li>
                <li>Data Breaches: None to date</li>
              </ul>

              <h4>14.2 Our Commitment</h4>
              <p>We are committed to:</p>
              <ul>
                <li>Transparency in data practices</li>
                <li>User control over personal data</li>
                <li>Industry-leading security standards</li>
                <li>Compliance with all applicable laws</li>
                <li>Continuous improvement of privacy practices</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>15. Additional Resources</h3>

              <h4>15.1 Related Documents</h4>
              <ul>
                <li>Terms of Service - Legal agreement for using REG-GPT</li>
                <li>Cookie Policy - Detailed cookie usage (if separate document created)</li>
                <li>Security Practices - Our security measures (if separate document created)</li>
              </ul>

              <h4>15.2 External Resources</h4>
              <ul>
                <li>UK ICO - Your Data Matters: https://ico.org.uk/</li>
                <li>Anthropic Privacy Policy: https://www.anthropic.com/privacy</li>
                <li>MongoDB Privacy Policy: https://www.mongodb.com/legal/privacy-policy</li>
                <li>UK GDPR Guide: https://ico.org.uk/for-organisations/guide-to-data-protection/</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>16. Acknowledgment and Acceptance</h3>
              <p><strong>BY USING REG-GPT, YOU ACKNOWLEDGE THAT:</strong></p>
              <ul>
                <li>You have read and understood this Privacy Policy</li>
                <li>You consent to the collection and use of information as described</li>
                <li>You understand your rights under data protection laws</li>
                <li>You understand data is processed internationally</li>
                <li>You are at least 18 years of age</li>
                <li>You agree to receive essential service communications</li>
                <li>You can opt out of non-essential communications at any time</li>
              </ul>
            </section>

            <div className={styles.footer}>
              <p>Thank you for trusting REG-GPT with your data. We are committed to protecting your privacy while providing a valuable building codes assistance service.</p>
              <p className={styles.effective}>This Privacy Policy is effective as of the "Last Updated" date shown above and applies to all users of REG-GPT.</p>
              <p>For questions, concerns, or to exercise your privacy rights, please contact us at teja@reggpt.uk</p>
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