// src/components/home/RegulationPanel/RegulationPanel.js - Building Codes Assistant - MOBILE RESPONSIVE
'use client';

import { useState, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TitleEditModal from './TitleEditModal';
import RegionSelector from './RegionSelector';
import { saveThemeOnLogout } from '@/hooks/useGuestTheme';
import DocumentViewer from '../DocumentViewer/DocumentViewer';
import styles from './RegulationPanel.module.css';


// ✅ Memoize DocumentViewer to prevent unnecessary re-renders during sidebar toggle
const MemoizedDocumentViewer = memo(DocumentViewer, (prevProps, nextProps) => {
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.citation === nextProps.citation &&
    prevProps.currentRegion === nextProps.currentRegion &&
    prevProps.onSummarizePage === nextProps.onSummarizePage
  );
});

export default function RegulationPanel({
  currentConversation,
  conversations,
  onSendMessage,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  onUpdateConversation,
  user,
  isGenerating,
  onEditMessage,
  currentRegulationResult,
  onSummarizePage,
  isSidebarOpen = true,
  onToggleSidebar
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTitleEditOpen, setIsTitleEditOpen] = useState(false);
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(isSidebarOpen);
  const [isMobile, setIsMobile] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Document viewer state
  const [documentViewer, setDocumentViewer] = useState({
    isOpen: false,
    citation: null
  });
  const router = useRouter();

  // Handle mobile detection and sidebar state
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

  // Handle sidebar state
  useEffect(() => {
    setSidebarOpen(isSidebarOpen);
  }, [isSidebarOpen]);

  // Helper function to get the display title for a conversation
  const getConversationDisplayTitle = (conversation) => {
    if (!conversation) return 'Building Codes Assistant';

    // ðŸ"§ FIX: Always use database title if it exists and is not empty
    if (conversation.title && conversation.title.trim() && conversation.title !== 'New Regulation Query') {
      return conversation.title;
    }

    // Fallback: Use first user message if no database title
    if (conversation.messages && conversation.messages.length > 0) {
      const firstUserMessage = conversation.messages.find(msg => msg.role === 'user');
      if (firstUserMessage && firstUserMessage.content) {
        const content = firstUserMessage.content.trim();
        if (content.length > 60) {
          return content.substring(0, 57) + '...';
        }
        return content;
      }
    }

    // Final fallback
    return 'New Regulation Query';
  };

  const handleLogout = async () => {
    try {
      // ðŸ†• Save current theme as guest preference BEFORE logout
      console.log('ðŸŽ¨ Saving theme preference before logout...');
      saveThemeOnLogout();
      
      // Existing logout logic
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSendMessage = async (message) => {
    console.log('ðŸ"¤ Sending regulation query:', message);
    onSendMessage(message);
  };

  const handleEditMessage = async (messageIndex, newContent) => {
    if (!currentConversation) {
      console.error('No current conversation for message editing');
      return;
    }

    console.log('ðŸ"§ Editing message:', { messageIndex, newContent, conversationId: currentConversation._id });

    try {
      if (onEditMessage) {
        await onEditMessage(messageIndex, newContent);
      } else {
        console.error('onEditMessage prop not provided');
        throw new Error('Message editing not available');
      }
    } catch (error) {
      console.error('âŒ Error editing message:', error);
      throw error;
    }
  };

  const canSendMessages = () => {
    if (!currentConversation) {
      console.log('âŒ Cannot send messages: No current conversation');
      return false;
    }
    if (isGenerating) {
      console.log('âŒ Cannot send messages: Currently generating');
      return false;
    }
    return true;
  };

  const handleSettingsClick = () => {
    setIsDropdownOpen(false);
    router.push('/dashboard/settings');
  };

  const handleTitleEdit = async (newTitle) => {
    if (!currentConversation || isUpdatingTitle) return;

    setIsUpdatingTitle(true);

    try {
      console.log('ðŸ·ï¸ Updating conversation title:', {
        conversationId: currentConversation._id,
        oldTitle: currentConversation.title,
        newTitle
      });

      const authToken = localStorage.getItem('authToken');

      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/conversations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          conversationId: currentConversation._id,
          updates: {
            title: newTitle
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update title');
      }

      console.log('âœ… Title updated in database:', data.conversation?.title);

      // Update the conversation in the frontend state
      if (onUpdateConversation && data.conversation) {
        onUpdateConversation(data.conversation);
      }

      setIsTitleEditOpen(false);

    } catch (error) {
      console.error('âŒ Error updating title:', error);
      throw error;
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const handleRegionSelected = async (regionData) => {
    console.log('ðŸŒ Region selected:', regionData);
    setShowRegionSelector(false);

    // Call the parent component's function to create conversation with region
    if (onNewConversation) {
      await onNewConversation(regionData);
    }
  };

  const handleRegionCancel = () => {
    setShowRegionSelector(false);
  };

  // NEW: Handle citation click from MessageList
  const handleCitationClick = (citation) => {
    console.log('📄 Opening document viewer:', citation);
    
    setDocumentViewer({
      isOpen: true,
      citation: citation
    });
  };

  // NEW: Handle closing document viewer
  const handleCloseDocumentViewer = () => {
    console.log('🚫 Closing document viewer');
    
    setDocumentViewer({
      isOpen: false,
      citation: null
    });
  };

  const toggleSidebar = () => {
    if (isToggling) return;  // ✅ Prevent rapid toggles during animation
    
    setIsToggling(true);
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    
    if (onToggleSidebar) {
      onToggleSidebar();
    }
    
    // Reset after transition completes (matches CSS transition duration)
    setTimeout(() => {
      setIsToggling(false);
    }, 300);
  };

  // Get the current display title
  const displayTitle = getConversationDisplayTitle(currentConversation);

  // Determine if the title is editable (show edit icon)
  const isTitleEditable = currentConversation && currentConversation.messages && currentConversation.messages.length > 0;

  console.log('ðŸ"‹ RegulationPanel - Title Display:', {
    conversationId: currentConversation?._id,
    storedTitle: currentConversation?.title,
    displayTitle,
    hasMessages: currentConversation?.messages?.length || 0,
    firstMessage: currentConversation?.messages?.[0]?.content?.substring(0, 30) + '...',
    isTitleEditable
  });

  // ðŸ†• MOBILE: Determine where the toggle button should appear
  const shouldShowToggleInHeader = isMobile && !sidebarOpen;
  const shouldShowToggleInSidebar = !isMobile || sidebarOpen;

  return (
    <div className={styles.regulationPanel}>
      {/* Conversation Sidebar */}
      <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <div className={styles.sidebarHeader}>
          {sidebarOpen && (
            <div className={styles.brand}>
              <div className={styles.logo}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.logoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className={styles.brandText}>RegGPT</span>
            </div>
          )}
          {/* ðŸ†• MOBILE: Toggle button in sidebar header (when sidebar is open OR desktop) */}
          {shouldShowToggleInSidebar && (
            <button
              onClick={toggleSidebar}
              className={styles.sidebarToggle}
              title={sidebarOpen ? 'Hide conversations' : 'Show conversations'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.toggleIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                )}
              </svg>
            </button>
          )}
        </div>

        {sidebarOpen && (
          <>
            <div className={styles.sidebarTitleSection}>
              <button
                onClick={() => setShowRegionSelector(true)}
                className={styles.newConversationBtn}
                title="Start new regulation query"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.actionIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className={styles.actionText}>New Query</span>
              </button>
              <h3 className={styles.sidebarTitle}>Regulation History</h3>
            </div>

            <div className={styles.sidebarContent}>
              <ConversationList
                conversations={conversations}
                currentConversation={currentConversation}
                onSelectConversation={onSelectConversation}
                onDeleteConversation={onDeleteConversation}
              />
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
                        onClick={handleSettingsClick}
                        className={styles.dropdownItem}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={styles.dropdownItemIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </button>
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

      {/* Main Content Area */}
      <div className={styles.mainArea}>
        {/* Header */}
        <div className={styles.mainHeader}>
          {/* ðŸ†• MOBILE: Toggle button in main header (when sidebar is closed on mobile) */}
          {shouldShowToggleInHeader && (
            <button
              onClick={toggleSidebar}
              className={styles.mainHeaderToggle}
              title="Show conversations"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.toggleIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}
          
          <div className={styles.headerTitle}>
            {currentConversation ? (
              <div className={styles.titleContainer}>
                {isTitleEditable ? (
                  <button
                    onClick={() => setIsTitleEditOpen(true)}
                    className={styles.editableTitleButton}
                    title="Click to rename conversation"
                  >
                    <h2 className={styles.conversationTitle}>{displayTitle}</h2>
                    <svg xmlns="http://www.w3.org/2000/svg" className={styles.editIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                ) : (
                  <h2 className={styles.conversationTitle}>{displayTitle}</h2>
                )}
              </div>
            ) : (
              <h2></h2>
            )}
          </div>
        </div>

        {/* Content Area with Split Layout */}
        <div className={styles.contentArea}>
          {/* Chat Area */}
          <div className={`${styles.chatArea} ${documentViewer.isOpen ? styles.chatAreaSplit : ''}`}>
            
            {/* Messages */}
            <div className={styles.messagesContainer}>
              {currentConversation ? (
                <MessageList
                  messages={currentConversation.messages || []}
                  isGenerating={isGenerating}
                  onEditMessage={handleEditMessage}
                  user={user}
                  conversationId={currentConversation._id}
                  currentConversation={currentConversation}
                  onCitationClick={handleCitationClick}
                />
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.welcomeMessage}>
                    <h3>Welcome to REG-GPT!</h3>
                    <p>Get instant, professional building code compliance reports with AI-powered analysis and precise citations.</p>
                  </div>
                  <div className={styles.getStartedMessage}>
                    <h3>Select "New Query" with a region to get started</h3>
                  </div>
                </div>
              )}
            </div>

            {/* FIXED: Only show MessageInput when there's a current conversation */}
            {currentConversation && (
              <div className={styles.inputContainer}>
                <MessageInput
                  onSendMessage={handleSendMessage}
                  isGenerating={isGenerating}
                  disabled={!canSendMessages()}
                  placeholder={
                    isGenerating
                      ? "Searching regulations..."
                      : "Ask about building codes, regulations, or compliance requirements..."
                  }
                  enableVoice={true}
                />
              </div>
            )}
          </div>

          {/* Document Viewer Panel */}
          {documentViewer.isOpen && (
            <div className={styles.documentViewerArea}>
              <MemoizedDocumentViewer
                isOpen={documentViewer.isOpen}
                onClose={handleCloseDocumentViewer}
                citation={documentViewer.citation}
                onSummarizePage={onSummarizePage}
                currentRegion={currentConversation?.region || 'Scotland'}
              />
            </div>
          )}
        </div>
      </div>

      {/* Title Edit Modal */}
      <TitleEditModal
        isOpen={isTitleEditOpen}
        currentTitle={displayTitle}
        onSave={handleTitleEdit}
        onCancel={() => setIsTitleEditOpen(false)}
        isLoading={isUpdatingTitle}
      />
      {/* Region Selector Modal */}
      <RegionSelector
        isOpen={showRegionSelector}
        onRegionSelect={handleRegionSelected}
        onCancel={handleRegionCancel}
      />
    </div>
  );
}