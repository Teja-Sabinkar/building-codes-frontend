// src/app/dashboard/home/page.js - Building Codes Assistant
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import RegulationPanel from '@/components/home/RegulationPanel/RegulationPanel';
import styles from './page.module.css';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Core conversation state
  const [currentConversation, setCurrentConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Regulation query data
  const [currentRegulationResult, setCurrentRegulationResult] = useState(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Update regulation result when conversation changes
  useEffect(() => {
    if (currentConversation?.messages && currentConversation.messages.length > 0) {
      // Find the most recent message with a regulation result
      const latestRegulationMessage = currentConversation.messages
        .slice().reverse()
        .find(msg => msg.regulation && msg.regulation.answer);

      if (latestRegulationMessage) {
        setCurrentRegulationResult(latestRegulationMessage.regulation);
      } else {
        setCurrentRegulationResult(null);
      }
    }
  }, [currentConversation]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);

        if (data.conversations.length > 0) {
          setCurrentConversation(data.conversations[0]);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Regulation Query',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newConversation = data.conversation;

        setConversations(prev => [newConversation, ...prev]);
        setCurrentConversation(newConversation);
        setCurrentRegulationResult(null);

        console.log('🆕 New conversation created:', {
          id: newConversation._id,
          title: newConversation.title
        });
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const sendMessage = async (message) => {
    if (!currentConversation) {
      await createNewConversation();
    }

    setIsGenerating(true);

    try {
      console.log('📤 Sending regulation query:', {
        message,
        conversationId: currentConversation?._id
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message,
          conversationId: currentConversation?._id,
          maxResults: 5
        }),
      });

      if (response.ok) {
        const data = await response.json();

        console.log('✅ Regulation query successful:', {
          hasConversation: !!data.conversation,
          hasResult: !!data.regulation,
          messageCount: data.conversation?.messages?.length,
          confidence: data.regulation?.confidence
        });

        // Update conversation state
        setCurrentConversation(data.conversation);
        setConversations(prev =>
          prev.map(conv =>
            conv._id === data.conversation._id ? data.conversation : conv
          )
        );

        // Update current regulation result
        if (data.regulation) {
          setCurrentRegulationResult(data.regulation);
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Error sending regulation query:', errorData);
      }
    } catch (error) {
      console.error('❌ Error sending regulation query:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectConversation = (conversation) => {
    console.log('🔄 Selecting conversation:', {
      id: conversation._id,
      title: conversation.title,
      messageCount: conversation.messages?.length || 0
    });

    setCurrentConversation(conversation);

    // Find latest regulation result in this conversation
    if (conversation.messages && conversation.messages.length > 0) {
      const latestRegulationMessage = conversation.messages
        .slice().reverse()
        .find(msg => msg.regulation && msg.regulation.answer);

      if (latestRegulationMessage) {
        setCurrentRegulationResult(latestRegulationMessage.regulation);
      } else {
        setCurrentRegulationResult(null);
      }
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      const response = await fetch(`/api/conversations?id=${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Filter out the deleted conversation
        const updatedConversations = conversations.filter(conv => conv._id !== conversationId);
        setConversations(updatedConversations);

        // Check if the deleted conversation was the current one
        if (currentConversation?._id === conversationId) {
          // If there are other conversations, select the first one
          if (updatedConversations.length > 0) {
            setCurrentConversation(updatedConversations[0]);
            
            // Find latest regulation in new current conversation
            if (updatedConversations[0].messages && updatedConversations[0].messages.length > 0) {
              const latestRegulationMessage = updatedConversations[0].messages
                .slice().reverse()
                .find(msg => msg.regulation && msg.regulation.answer);

              setCurrentRegulationResult(latestRegulationMessage?.regulation || null);
            } else {
              setCurrentRegulationResult(null);
            }
          } else {
            // If no more conversations, create a new one
            setCurrentConversation(null);
            setCurrentRegulationResult(null);
            createNewConversation();
          }
        }
      } else {
        throw new Error('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  };

  const handleEditMessage = async (messageIndex, newContent) => {
    if (!currentConversation) {
      console.error('No current conversation for message editing');
      return;
    }

    console.log('🔧 Editing message:', { messageIndex, newContent, conversationId: currentConversation._id });

    try {
      // Call the edit message API
      const response = await fetch('/api/messages/edit', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: currentConversation._id,
          messageIndex: messageIndex,
          newContent: newContent,
          shouldRegenerate: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to edit message');
      }

      const data = await response.json();
      console.log('✅ Message edited successfully:', data);

      // Update the conversation state with the edited conversation
      setCurrentConversation(data.conversation);
      setConversations(prev =>
        prev.map(conv =>
          conv._id === data.conversation._id ? data.conversation : conv
        )
      );

      // If the API indicates we should regenerate, trigger the regulation query API
      if (data.shouldRegenerate) {
        console.log('🔄 Triggering regeneration...');
        setIsGenerating(true);

        try {
          // Call the building codes query API to regenerate from the edited message
          const queryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              question: '', // Empty message since we're regenerating
              conversationId: currentConversation._id,
              isRegeneration: true
            }),
          });

          if (queryResponse.ok) {
            const queryData = await queryResponse.json();
            console.log('✅ Regeneration completed:', queryData);

            // Update conversation with the new response
            setCurrentConversation(queryData.conversation);
            setConversations(prev =>
              prev.map(conv =>
                conv._id === queryData.conversation._id ? queryData.conversation : conv
              )
            );

            // Update current regulation result if a new one was generated
            if (queryData.regulation) {
              setCurrentRegulationResult(queryData.regulation);
            }
          } else {
            const errorData = await queryResponse.json();
            console.error('❌ Regeneration failed:', errorData);
            throw new Error('Failed to regenerate response');
          }
        } catch (regenError) {
          console.error('❌ Regeneration error:', regenError);
          // Don't throw here, the edit was successful even if regeneration failed
        } finally {
          setIsGenerating(false);
        }
      }

    } catch (error) {
      console.error('❌ Error editing message:', error);
      setIsGenerating(false);
      throw error; // Re-throw so RegulationPanel can handle the error
    }
  };

  const updateConversation = (updatedConversation) => {
    console.log('🔄 Updating conversation in state:', {
      id: updatedConversation._id,
      newTitle: updatedConversation.title
    });

    // Update current conversation if it's the one being updated
    if (currentConversation && currentConversation._id === updatedConversation._id) {
      setCurrentConversation(updatedConversation);
    }

    // Update conversations list
    setConversations(prev =>
      prev.map(conv =>
        conv._id === updatedConversation._id ? updatedConversation : conv
      )
    );
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        {/* Regulation Panel - Main interface */}
        <RegulationPanel
          currentConversation={currentConversation}
          conversations={conversations}
          onSendMessage={sendMessage}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          onNewConversation={createNewConversation}
          onUpdateConversation={updateConversation}
          user={user}
          isGenerating={isGenerating}
          onEditMessage={handleEditMessage}
          currentRegulationResult={currentRegulationResult}
        />
      </div>
    </div>
  );
}