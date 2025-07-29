// src/components/home/RegulationPanel/RegulationPanel.js - Building Codes Assistant
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TitleEditModal from './TitleEditModal';
import styles from './RegulationPanel.module.css';

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
  isSidebarOpen = true,
  onToggleSidebar
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTitleEditOpen, setIsTitleEditOpen] = useState(false);
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(isSidebarOpen);
  const router = useRouter();

  // Handle sidebar state
  useEffect(() => {
    setSidebarOpen(isSidebarOpen);
  }, [isSidebarOpen]);

  const handleLogout = async () => {
    try {
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
    console.log('📤 Sending regulation query:', message);
    onSendMessage(message);
  };

  const handleEditMessage = async (messageIndex, newContent) => {
    if (!currentConversation) {
      console.error('No current conversation for message editing');
      return;
    }

    console.log('🔧 Editing message:', { messageIndex, newContent, conversationId: currentConversation._id });

    try {
      if (onEditMessage) {
        await onEditMessage(messageIndex, newContent);
      } else {
        console.error('onEditMessage prop not provided');
        throw new Error('Message editing not available');
      }
    } catch (error) {
      console.error('❌ Error editing message:', error);
      throw error;
    }
  };

  const canSendMessages = () => {
    if (!currentConversation) {
      console.log('❌ Cannot send messages: No current conversation');
      return false;
    }
    if (isGenerating) {
      console.log('❌ Cannot send messages: Currently generating');
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
      console.log('🏷️ Updating conversation title:', {
        conversationId: currentConversation._id,
        oldTitle: currentConversation.title,
        newTitle
      });

      const response = await fetch('/api/conversations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
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

      console.log('✅ Title updated successfully:', data);

      if (onUpdateConversation && data.conversation) {
        onUpdateConversation(data.conversation);
      }

      setIsTitleEditOpen(false);

    } catch (error) {
      console.error('❌ Error updating title:', error);
      throw error;
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

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
              <span className={styles.brandText}>Reg-GPT</span>
            </div>
          )}
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
        </div>

        {sidebarOpen && (
          <>
            <div className={styles.sidebarTitleSection}>
              <button
                onClick={onNewConversation}
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
          <div className={styles.headerTitle}>
            {currentConversation ? (
              <div className={styles.titleContainer}>
                <button
                  onClick={() => setIsTitleEditOpen(true)}
                  className={styles.editableTitleButton}
                  title="Click to rename conversation"
                >
                  <h2 className={styles.conversationTitle}>{currentConversation.title}</h2>
                  <svg xmlns="http://www.w3.org/2000/svg" className={styles.editIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
         
              </div>
            ) : (
              <h2>Building Codes Assistant</h2>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messagesContainer}>
          {currentConversation ? (
            <MessageList
              messages={currentConversation.messages || []}
              isGenerating={isGenerating}
              onEditMessage={handleEditMessage}
              user={user}
              enableTTS={true}
            />
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.emptyIconSvg} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>Start a new regulation query</h3>
              <p className={styles.emptyDescription}>
                Ask about building codes, regulations, and compliance requirements to get instant answers with references.
              </p>
              <div className={styles.examplePrompts}>
                <p className={styles.exampleTitle}>Try asking:</p>
                <ul className={styles.exampleList}>
                  <li>"What are the minimum ceiling heights for residential buildings?"</li>
                  <li>"Fire escape requirements for 3-story office building"</li>
                  <li>"Accessibility requirements for public buildings"</li>
                  <li>"Minimum window sizes for emergency egress"</li>
                  <li>"Structural requirements for load-bearing walls"</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className={styles.inputContainer}>
          <MessageInput
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
            disabled={!canSendMessages()}
            placeholder={
              !currentConversation
                ? "Start a new conversation first..."
                : isGenerating
                  ? "Searching regulations..."
                  : "Ask about building codes, regulations, or compliance requirements..."
            }
            enableVoice={true}
          />
        </div>
      </div>

      {/* Title Edit Modal */}
      <TitleEditModal
        isOpen={isTitleEditOpen}
        currentTitle={currentConversation?.title || ''}
        onSave={handleTitleEdit}
        onCancel={() => setIsTitleEditOpen(false)}
        isLoading={isUpdatingTitle}
      />
    </div>
  );
}