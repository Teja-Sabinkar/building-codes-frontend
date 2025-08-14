// src/app/dashboard/settings/page.js - COMPLETELY FLASH-FREE VERSION WITH MOBILE TOGGLE
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import SettingsLayout from '@/components/settings/SettingsLayout';
import GeneralSettings from '@/components/settings/GeneralSettings';
import FeedbackForm from '@/components/settings/FeedbackForm';
import { saveThemeOnLogout } from '@/hooks/useGuestTheme';
import styles from './page.module.css';

// 🆕 IMMEDIATE THEME APPLICATION - RUNS BEFORE COMPONENT RENDERS
if (typeof window !== 'undefined') {
  console.log('🚀 Settings page - Immediate theme application');
  
  try {
    const savedTheme = localStorage.getItem('regGPT-darkMode');
    const isDark = savedTheme === 'true';
    
    console.log('🎨 Settings page - Detected theme:', isDark ? 'dark' : 'light');
    
    // Apply to html, body, and create settings page styling
    const applyImmediateTheme = (dark) => {
      // Apply to document elements
      if (dark) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
        document.documentElement.style.backgroundColor = '#1a1a1a';
        document.body.style.backgroundColor = '#1a1a1a';
        document.documentElement.style.color = '#e5e5e5';
        document.body.style.color = '#e5e5e5';
      } else {
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
        document.documentElement.style.backgroundColor = '#ffffff';
        document.body.style.backgroundColor = '#ffffff';
        document.documentElement.style.color = '#1f2937';
        document.body.style.color = '#1f2937';
      }
      
      console.log('✅ Settings page - Theme applied to document elements');
    };
    
    applyImmediateTheme(isDark);
    
    // Also apply when page loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        applyImmediateTheme(isDark);
        console.log('🔄 Settings page - Theme reapplied on DOMContentLoaded');
      });
    }
    
  } catch (error) {
    console.error('❌ Settings page - Error in immediate theme application:', error);
  }
}

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // 🆕 MOBILE: Handle mobile detection and sidebar state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 480;
      setIsMobile(mobile);
    };

    // Check on mount
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🆕 ENSURE THEME IS APPLIED IMMEDIATELY ON MOUNT
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('regGPT-darkMode');
        const isDark = savedTheme === 'true';
        
        console.log('🎨 Settings page useEffect - Ensuring theme:', isDark ? 'dark' : 'light');
        
        // Apply to all relevant elements
        const elements = [
          document.documentElement,
          document.body,
          document.querySelector('[data-settings-page]')
        ].filter(Boolean);
        
        elements.forEach(el => {
          if (isDark) {
            el.classList.add('dark-mode');
            if (el === document.documentElement || el === document.body) {
              el.style.backgroundColor = '#1a1a1a';
              el.style.color = '#e5e5e5';
            }
          } else {
            el.classList.remove('dark-mode');
            if (el === document.documentElement || el === document.body) {
              el.style.backgroundColor = '#ffffff';
              el.style.color = '#1f2937';
            }
          }
        });
        
        console.log('✅ Settings page - Theme applied to all elements in useEffect');
        
      } catch (error) {
        console.error('❌ Settings page - Error in useEffect theme application:', error);
      }
    }
  }, []); // Run immediately on mount

  // 🆕 ADDITIONAL THEME SYNC WITH USER OBJECT
  useEffect(() => {
    if (user?.preferences?.theme && typeof window !== 'undefined') {
      const userTheme = user.preferences.theme;
      const savedTheme = localStorage.getItem('regGPT-darkMode');
      const shouldBeDark = userTheme === 'dark';
      
      // Sync localStorage with user preference
      if (savedTheme !== shouldBeDark.toString()) {
        localStorage.setItem('regGPT-darkMode', shouldBeDark.toString());
        console.log('🔄 Settings page - Synced localStorage with user preference:', userTheme);
      }
      
      // Apply theme
      const elements = [
        document.documentElement,
        document.body,
        document.querySelector('[data-settings-page]')
      ].filter(Boolean);
      
      elements.forEach(el => {
        if (shouldBeDark) {
          el.classList.add('dark-mode');
        } else {
          el.classList.remove('dark-mode');
        }
      });
      
      console.log('✅ Settings page - Synced theme with user object:', userTheme);
    }
  }, [user?.preferences?.theme]);

  // Redirect to login if not authenticated
  if (!loading && !user) {
    router.push('/auth/login');
    return null;
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      // 🆕 Save current theme as guest preference BEFORE logout
      console.log('🎨 Saving theme preference before logout...');
      saveThemeOnLogout();
      
      // Existing logout logic
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleNewConversation = () => {
    router.push('/dashboard/home');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 🆕 MOBILE: Determine where the toggle button should appear
  const shouldShowToggleInContent = isMobile && !isSidebarOpen;
  const shouldShowToggleInSidebar = !isMobile || isSidebarOpen;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings user={user} />;
      case 'feedback':
        return <FeedbackForm />;
      default:
        return <GeneralSettings user={user} />;
    }
  };

  return (
    <div className={styles.settingsPage} data-settings-page>
      <div className={styles.layout}>
        {/* REG-GPT Sidebar */}
        <div className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
          <div className={styles.sidebarHeader}>
            {isSidebarOpen && (
              <div className={styles.brand}>
                <div className={styles.logo}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={styles.logoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className={styles.brandText}>RegGPT</span>
              </div>
            )}
            {/* 🆕 MOBILE: Toggle button in sidebar header (when sidebar is open OR desktop) */}
            {shouldShowToggleInSidebar && (
              <button
                onClick={toggleSidebar}
                className={styles.sidebarToggle}
                title={isSidebarOpen ? 'Hide conversations' : 'Show conversations'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.toggleIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isSidebarOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  )}
                </svg>
              </button>
            )}
          </div>

          {isSidebarOpen && (
            <>
              <div className={styles.sidebarTitleSection}>
                <button
                  onClick={handleNewConversation}
                  className={styles.newConversationBtn}
                  title="Back to conversations"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={styles.actionIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className={styles.actionText}>Back to Chat</span>
                </button>
                <h3 className={styles.sidebarTitle}>Settings</h3>
              </div>

              <div className={styles.sidebarContent}>
                {/* Settings navigation */}
                <div className={styles.settingsNav}>
                  <button
                    onClick={() => setActiveTab('general')}
                    className={`${styles.navItem} ${activeTab === 'general' ? styles.navItemActive : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={styles.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    General
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('feedback')}
                    className={`${styles.navItem} ${activeTab === 'feedback' ? styles.navItemActive : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={styles.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Feedback
                  </button>
                </div>
              </div>

              {/* User Menu at Bottom */}
              <div className={styles.sidebarFooter}>
                <div className={styles.userMenu}>
                  <button
                    onClick={toggleDropdown}
                    className={styles.userButton}
                    title={`Logged in as ${user.name}`}
                  >
                    <div className={styles.userAvatar}>
                      <span className={styles.userInitial}>
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className={styles.userName}>{user.name}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={styles.dropdownIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownContent}>
                        <div className={styles.userInfo}>
                          <p className={styles.userNameDropdown}>{user.name}</p>
                          <p className={styles.userEmail}>{user.email}</p>
                        </div>
                        <hr className={styles.divider} />
                        <button
                          onClick={handleLogout}
                          className={styles.dropdownItem}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={styles.dropdownItemIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Click outside to close dropdown */}
                {isDropdownOpen && (
                  <div
                    className={styles.dropdownOverlay}
                    onClick={() => setIsDropdownOpen(false)}
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Main Settings Content */}
        <div className={styles.mainContent}>
          <div className={styles.settingsContainer}>
            <SettingsLayout 
              shouldShowToggleInContent={shouldShowToggleInContent}
              onToggleSidebar={toggleSidebar}
            >
              {renderTabContent()}
            </SettingsLayout>
          </div>
        </div>
      </div>
    </div>
  );
}