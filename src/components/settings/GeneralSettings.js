// src/components/settings/GeneralSettings.js - Enhanced with Smart Persistence Logout
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ClearHistory from './ClearHistory';
import DeleteModel from './DeleteModel';
import styles from './GeneralSettings.module.css';

export default function GeneralSettings({ user }) {
  const { updateUser } = useAuth(); // Get updateUser function from auth context
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isThemeLoading, setIsThemeLoading] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Load theme preference on component mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        // First, try to get from user object (if available)
        if (user?.preferences?.theme) {
          const userTheme = user.preferences.theme;
          const isDark = userTheme === 'dark';
          setIsDarkMode(isDark);
          applyTheme(isDark);
          console.log(`🎨 Loaded theme from user object: ${userTheme}`);
          return;
        }

        // Fallback: Try to get from API
        const token = localStorage.getItem('authToken') ||
          localStorage.getItem('token') ||
          sessionStorage.getItem('authToken');

        if (token) {
          const response = await fetch('/api/user/theme', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const isDark = data.theme === 'dark';
            setIsDarkMode(isDark);
            applyTheme(isDark);
            console.log(`🎨 Loaded theme from API: ${data.theme}`);
          } else {
            // Fallback: Check localStorage for temporary preference
            const savedTheme = localStorage.getItem('regGPT-darkMode');
            if (savedTheme) {
              const isDark = savedTheme === 'true';
              setIsDarkMode(isDark);
              applyTheme(isDark);
              console.log(`🎨 Loaded theme from localStorage: ${isDark ? 'dark' : 'light'}`);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error loading theme preference:', error);
        // Fallback to localStorage
        const savedTheme = localStorage.getItem('regGPT-darkMode');
        if (savedTheme) {
          const isDark = savedTheme === 'true';
          setIsDarkMode(isDark);
          applyTheme(isDark);
        }
      }
    };

    loadThemePreference();
  }, [user]);

  const applyTheme = (isDark) => {
    // Apply to settings page if it exists
    const settingsPage = document.querySelector('[data-settings-page]');
    if (settingsPage) {
      if (isDark) {
        settingsPage.classList.add('dark-mode');
      } else {
        settingsPage.classList.remove('dark-mode');
      }
    }

    // 🆕 APPLY GLOBALLY TO BODY for all pages (including home page)
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const handleToggleTheme = async () => {
    setIsThemeLoading(true);
    const newDarkMode = !isDarkMode;
    const newTheme = newDarkMode ? 'dark' : 'light';

    try {
      // Update UI immediately for better UX
      setIsDarkMode(newDarkMode);
      applyTheme(newDarkMode);

      // Save to localStorage as backup
      localStorage.setItem('regGPT-darkMode', newDarkMode.toString());

      // Save to backend
      const token = localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('authToken');

      if (token) {
        const response = await fetch('/api/user/theme', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ theme: newTheme })
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Theme saved to backend: ${data.theme}`);

          // Update user context if updateUser function is available
          if (updateUser && user) {
            updateUser({
              ...user,
              preferences: {
                ...user.preferences,
                theme: newTheme
              }
            });
          }
        } else {
          console.error('❌ Failed to save theme to backend');
          // Theme is still applied locally, so user experience isn't affected
        }
      }

      console.log(`🎨 Theme toggled: ${newTheme}`);

    } catch (error) {
      console.error('❌ Error saving theme preference:', error);
      // Don't revert UI change - keep the better user experience
    } finally {
      setIsThemeLoading(false);
    }
  };

  const handleClearHistoryClick = () => {
    setShowClearHistoryModal(true);
  };

  const handleClearHistoryConfirm = async () => {
    setIsLoading(true);
    try {
      // Get the authentication token (try multiple storage locations)
      const token = localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('authToken');

      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      console.log('🔄 Starting clear history operation...');

      // Call the clear conversations API endpoint
      const response = await fetch('/api/conversations/clear', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to clear history (${response.status})`);
      }

      const result = await response.json();

      console.log('✅ Clear history API response:', result);

      // 🔧 CRITICAL FIX: Add cleared conversations to deletion tracking
      if (result.operationResults && Array.isArray(result.operationResults)) {
        const clearedIds = result.operationResults
          .filter(op => op.status === 'archived' || op.status === 'already_archived')
          .map(op => op.conversationId);

        console.log('🔧 Adding cleared conversation IDs to deletion tracking:', {
          clearedCount: clearedIds.length,
          conversationIds: clearedIds
        });

        // Get existing deleted IDs
        const existingDeletedIds = JSON.parse(localStorage.getItem('deletedConversationIds') || '[]');

        // Merge with newly cleared IDs
        const allDeletedIds = [...new Set([...existingDeletedIds, ...clearedIds])];

        // Save back to localStorage
        localStorage.setItem('deletedConversationIds', JSON.stringify(allDeletedIds));

        console.log('✅ Updated deletion tracking:', {
          previousCount: existingDeletedIds.length,
          newCount: allDeletedIds.length,
          totalDeleted: allDeletedIds.length
        });
      }

      // Clear frontend deletion tracking since all conversations are now cleared
      localStorage.removeItem('currentConversationId');

      // Clear any other conversation-related localStorage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('conversation_') || key.includes('ConversationId'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      console.log('🧹 Cleared frontend storage:', {
        deletedConversationIds: 'removed',
        currentConversationId: 'removed',
        otherConversationKeys: keysToRemove.length
      });

      // Close modal first
      setShowClearHistoryModal(false);

      // Show success message with details
      const message = result.permanent
        ? `${result.deletedCount} conversations permanently deleted`
        : `${result.deletedCount} conversations cleared successfully`;

      alert(message + '\n\nPage will reload to refresh the conversation list.');

      // Optional: Trigger a custom event to notify parent components
      window.dispatchEvent(new CustomEvent('conversationsCleared', {
        detail: { deletedCount: result.deletedCount, permanent: result.permanent }
      }));

      // Reload the page to refresh the conversation list
      window.location.reload();

    } catch (error) {
      console.error('❌ Error clearing history:', error);

      // Show specific error message
      const errorMessage = error.message.includes('token')
        ? 'Authentication error. Please log out and log back in.'
        : `Failed to clear history: ${error.message}`;

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistoryCancel = () => {
    setShowClearHistoryModal(false);
  };

  const handleDeleteAccountClick = () => {
    setShowDeleteAccountModal(true);
  };

  const handleDeleteAccountConfirm = async () => {
    setIsLoading(true);
    try {
      // Get the authentication token
      const token = localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('authToken');

      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      console.log('🔄 Starting account deletion...');

      // Call the delete account API endpoint
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete account (${response.status})`);
      }

      const result = await response.json();

      console.log('✅ Account deletion successful:', result);

      // Close modal first
      setShowDeleteAccountModal(false);

      // Clear all local storage and session storage
      localStorage.clear();
      sessionStorage.clear();

      // Show success message with deletion details
      const deletionSummary = result.deletionSummary;
      const message = `Account successfully deactivated!

Details:
• Account deactivated: ${new Date(deletionSummary.deletedAt).toLocaleDateString()}
• Conversations archived: ${deletionSummary.conversationsArchived}
• Data preserved: ${deletionSummary.dataPreserved ? 'Yes' : 'No'}
• Recoverable: ${deletionSummary.recoverable ? 'Yes (by admin)' : 'No'}

You will now be redirected to the homepage.`;

      alert(message);

      // Redirect to homepage after successful deletion
      window.location.href = '/';

    } catch (error) {
      console.error('❌ Error deleting account:', error);

      // Show specific error message based on error type
      let errorMessage;
      if (error.message.includes('token')) {
        errorMessage = 'Authentication error. Please log out and log back in.';
      } else if (error.message.includes('ACCOUNT_DELETED')) {
        errorMessage = 'This account has already been deleted.';
      } else {
        errorMessage = `Failed to delete account: ${error.message}`;
      }

      alert(errorMessage);

      // If account was already deleted, redirect to login
      if (error.message.includes('ACCOUNT_DELETED')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/auth/login';
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccountCancel = () => {
    setShowDeleteAccountModal(false);
  };

  // 🆕 ENHANCED LOGOUT: Save current theme as guest preference
  const handleLogout = async () => {
    try {
      // 🆕 SMART PERSISTENCE: Save current theme as guest preference for auth pages
      const currentTheme = isDarkMode ? 'dark' : 'light';
      localStorage.setItem('regGPT-guestTheme', currentTheme);
      console.log('💾 Saved current theme as guest preference:', currentTheme);

      // Proceed with normal logout
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      console.log('🚪 Logout successful - theme preserved for auth pages');
      
      // Redirect to login (auth pages will use the saved guest theme)
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if logout API fails, redirect to login
      window.location.href = '/auth/login';
    }
  };

  return (
    <>
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
                Toggle between dark and light themes. Your preference is saved to your account.
              </div>
            </div>
            <div className={styles.toggleContainer}>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={handleToggleTheme}
                  disabled={isLoading || isThemeLoading}
                />
                <span className={styles.slider}></span>
              </label>
              <span className={styles.toggleLabel}>
                {isThemeLoading ? 'Saving...' : (isDarkMode ? 'Dark' : 'Light')}
              </span>
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
                Remove all conversation history and building code queries from your account.
              </div>
            </div>
            <button
              className={styles.secondaryButton}
              onClick={handleClearHistoryClick}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Clear history'}
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
              onClick={handleDeleteAccountClick}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Delete Account'}
            </button>
          </div>
        </section>

      </div>

      {/* Clear History Modal */}
      <ClearHistory
        isOpen={showClearHistoryModal}
        onClose={handleClearHistoryCancel}
        onConfirm={handleClearHistoryConfirm}
        isLoading={isLoading}
      />

      {/* Delete Account Modal */}
      <DeleteModel
        isOpen={showDeleteAccountModal}
        onClose={handleDeleteAccountCancel}
        onConfirm={handleDeleteAccountConfirm}
        isLoading={isLoading}
        user={user}
      />
    </>
  );
}