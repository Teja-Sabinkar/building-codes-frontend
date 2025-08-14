// src/components/settings/SettingsLayout.js - Mobile Toggle Support
import styles from './SettingsLayout.module.css';

export default function SettingsLayout({ 
  children, 
  shouldShowToggleInContent = false, 
  onToggleSidebar 
}) {
  return (
    <div className={styles.settingsLayout}>
      <div className={styles.contentContainer}>
        {/* 🆕 MOBILE: Toggle button at top-left when sidebar is closed */}
        {shouldShowToggleInContent && (
          <button
            onClick={onToggleSidebar}
            className={styles.contentToggle}
            title="Show sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.toggleIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
        
        {/* Settings Content */}
        {children}
      </div>
    </div>
  );
}