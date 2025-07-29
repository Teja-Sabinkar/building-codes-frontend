// src/components/settings/GeneralSettings.js
import { useState } from 'react';
import styles from './GeneralSettings.module.css';

export default function GeneralSettings({ user }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Here you would implement actual theme switching logic
    console.log('Theme toggled:', !isDarkMode ? 'dark' : 'light');
  };

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear your conversation history? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        // TODO: Implement clear history API call
        // const response = await fetch('/api/conversations/clear', {
        //   method: 'DELETE',
        // });
        
        // Simulate API call for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('History cleared');
        alert('Conversation history cleared successfully!');
      } catch (error) {
        console.error('Error clearing history:', error);
        alert('An error occurred while clearing history.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'Are you sure you want to permanently delete your account? This action cannot be undone.\n\n' +
      'Type "DELETE" to confirm:'
    );
    
    if (confirmation === 'DELETE') {
      setIsLoading(true);
      try {
        // TODO: Implement account deletion API call
        // const response = await fetch('/api/auth/delete-account', {
        //   method: 'DELETE',
        // });
        
        // Simulate API call for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Account deletion requested');
        alert('Account deletion requested. You will be logged out.');
        // TODO: Redirect to logout
        // window.location.href = '/auth/login';
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('An error occurred while deleting account.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={styles.generalSettings}>
      <h2 className={styles.mainHeading}>Account Settings</h2>
      
      {/* Account Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionHeading}>Account</h3>
        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>Name</div>
          <div className={styles.settingValue}>{user?.name || 'Not available'}</div>
        </div>
        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>Email Address</div>
          <div className={styles.settingValue}>{user?.email || 'Not available'}</div>
        </div>
      </section>
      
      {/* Preferences Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionHeading}>Preferences</h3>
        <div className={styles.settingItem}>
          <div>
            <div className={styles.settingLabel}>Dark / Light Mode</div>
            <div className={styles.settingDescription}>
              Toggle between dark and light themes for the application.
            </div>
          </div>
          <div className={styles.toggleContainer}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={handleToggleTheme}
                disabled={isLoading}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div>
      </section>
      
      {/* Data & Privacy Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionHeading}>Data & Privacy</h3>
        <div className={styles.settingItem}>
          <div>
            <div className={styles.settingLabel}>Clear History</div>
            <div className={styles.settingDescription}>
              Remove all conversation history and floor plans from your account.
            </div>
          </div>
          <button 
            className={styles.secondaryButton}
            onClick={handleClearHistory}
            disabled={isLoading}
          >
            {isLoading ? 'Clearing...' : 'Clear history'}
          </button>
        </div>
      </section>
      
      {/* Danger Zone */}
      <section className={`${styles.section} ${styles.dangerSection}`}>
        <h3 className={styles.sectionHeading}>Danger Zone</h3>
        <div className={styles.settingItem}>
          <div>
            <div className={styles.settingLabel}>Delete Account</div>
            <div className={styles.settingDescription}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </div>
          </div>
          <button 
            className={styles.deleteButton}
            onClick={handleDeleteAccount}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Delete Account'}
          </button>
        </div>
      </section>
    </div>
  );
}