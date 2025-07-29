// src/components/home/RegulationPanel/ConversationList.js
'use client';

import { useState } from 'react';
import DeleteModal from './DeleteModal';
import styles from './ConversationList.module.css';

export default function ConversationList({
  conversations,
  currentConversation,
  onSelectConversation,
  onDeleteConversation
}) {
  const [hoveredConversation, setHoveredConversation] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, conversation: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateText = (text, maxLength = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleDeleteClick = (e, conversation) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, conversation });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.conversation || !onDeleteConversation) return;
    
    setIsDeleting(true);
    try {
      await onDeleteConversation(deleteModal.conversation._id);
      setDeleteModal({ isOpen: false, conversation: null });
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, conversation: null });
  };

  // Helper function to get conversation preview text
  const getConversationPreview = (conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return 'No messages yet';
    }

    // Find the first user message for preview
    const firstUserMessage = conversation.messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      return truncateText(firstUserMessage.content, 50);
    }

    return 'Regulation query';
  };

  // Helper function to count regulation queries in conversation
  const getRegulationCount = (conversation) => {
    if (!conversation.messages) return 0;
    return conversation.messages.filter(msg => 
      msg.role === 'assistant' && msg.regulation && msg.regulation.answer
    ).length;
  };

  if (conversations.length === 0) {
    return (
      <div className={styles.emptyConversations}>
        <div className={styles.emptyIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.emptyIconSvg} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className={styles.emptyText}>No regulation queries yet</p>
        <p className={styles.emptySubtext}>Start a new query to begin</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.conversationList}>
        {conversations.map((conversation) => {
          const regulationCount = getRegulationCount(conversation);
          const preview = getConversationPreview(conversation);
          
          return (
            <div
              key={conversation._id}
              className={`${styles.conversationItem} ${
                currentConversation?._id === conversation._id ? styles.active : ''
              }`}
              onClick={() => onSelectConversation(conversation)}
              onMouseEnter={() => setHoveredConversation(conversation._id)}
              onMouseLeave={() => setHoveredConversation(null)}
            >
              <div className={styles.conversationHeader}>
                <h4 className={styles.conversationTitle}>
                  {truncateText(conversation.title)}
                </h4>
                <span className={styles.conversationDate}>
                  {formatDate(conversation.updatedAt || conversation.createdAt)}
                </span>
              </div>

              {/* Conversation preview and metadata */}
              <div className={styles.conversationMeta}>
                <p className={styles.conversationPreview}>
                  {preview}
                </p>
                <div className={styles.conversationStats}>
                  {regulationCount > 0 && (
                    <span className={styles.regulationCount} title="Regulation queries answered">
                      <svg xmlns="http://www.w3.org/2000/svg" className={styles.statIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {regulationCount}
                    </span>
                  )}
                  <span className={styles.messageCount} title="Total messages">
                    <svg xmlns="http://www.w3.org/2000/svg" className={styles.statIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {conversation.messages?.length || 0}
                  </span>
                </div>
              </div>

              {/* Options menu (show on hover) */}
              {hoveredConversation === conversation._id && (
                <div className={styles.conversationOptions}>
                  <button
                    className={styles.optionButton}
                    title="Delete conversation"
                    onClick={(e) => handleDeleteClick(e, conversation)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={styles.optionIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        conversationTitle={deleteModal.conversation?.title || ''}
        isDeleting={isDeleting}
      />
    </>
  );
}