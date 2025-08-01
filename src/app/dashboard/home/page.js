// src/app/dashboard/home/page.js - Building Codes Assistant - QUERY TYPE AWARENESS
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

        return newConversation; // Return the new conversation
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
    return null;
  };

  const sendMessage = async (message) => {
    console.log('📤 Sending regulation query:', message);
    
    // Ensure we have a current conversation
    let conversation = currentConversation;
    if (!conversation) {
      console.log('🔄 No current conversation, creating new one...');
      conversation = await createNewConversation();
      if (!conversation) {
        console.error('❌ Failed to create conversation');
        return;
      }
    }

    if (isGenerating) {
      console.log('❌ Cannot send messages: Currently generating');
      return;
    }

    setIsGenerating(true);

    try {
      console.log('📤 Sending regulation query:', {
        message,
        conversationId: conversation._id,
        apiUrl: process.env.NEXT_PUBLIC_API_URL
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message,
          conversationId: conversation._id,
          maxResults: 10  // Request 10 results to get chunks 1-3 + 4-8 for references
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // 🔍 DEBUG: Log the complete API response including query_type
        console.log('🔍 FULL API RESPONSE:', JSON.stringify(data, null, 2));
        console.log('🔍 API Response received:', data);
        console.log('🔍 Has regulation:', !!data.regulation);
        console.log('🔍 Query Type:', data.regulation?.query_type);
        console.log('🔍 References:', data.regulation?.references);
        console.log('🔍 References count:', data.regulation?.references?.length);

        console.log('✅ Regulation query successful:', {
          hasConversation: !!data.conversation,
          hasResult: !!data.regulation,
          queryType: data.regulation?.query_type,
          messageCount: data.conversation?.messages?.length,
          confidence: data.regulation?.confidence,
          referencesCount: data.regulation?.references?.length
        });

        // 🔧 CRITICAL FIX: Ensure assistant messages have regulation data WITH QUERY TYPE
        if (data.conversation && data.conversation.messages && data.regulation) {
          console.log('🔧 Attaching regulation data (with query_type) to assistant messages...');
          
          const updatedMessages = data.conversation.messages.map((msg, index) => {
            // If this is an assistant message, attach the regulation data
            if (msg.role === 'assistant') {
              console.log(`🔗 Attaching regulation to assistant message ${index}:`, {
                queryType: data.regulation.query_type,
                hasReferences: !!data.regulation.references,
                referencesCount: data.regulation.references?.length || 0
              });
              return {
                ...msg,
                regulation: {
                  ...data.regulation,
                  // Ensure query_type is preserved in message regulation data
                  query_type: data.regulation.query_type
                }
              };
            }
            return msg;
          });

          // Update the conversation with regulation-enhanced messages
          data.conversation.messages = updatedMessages;
          console.log('✅ Regulation data (with query_type) attached to', updatedMessages.filter(m => m.role === 'assistant').length, 'assistant messages');
        }

        // Update conversation state
        setCurrentConversation(data.conversation);
        setConversations(prev => {
          const updated = prev.map(conv =>
            conv._id === data.conversation._id ? data.conversation : conv
          );
          // If this is a new conversation, add it
          if (!prev.find(conv => conv._id === data.conversation._id)) {
            return [data.conversation, ...prev];
          }
          return updated;
        });

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
              question: newContent, // Use the edited content for regeneration
              conversationId: currentConversation._id,
              maxResults: 10,  // Ensure we get references
              isRegeneration: true
            }),
          });

          if (queryResponse.ok) {
            const queryData = await queryResponse.json();
            console.log('✅ Regeneration completed:', queryData);

            // 🔧 CRITICAL: Attach regulation data with query_type to the latest assistant message
            if (queryData.conversation && queryData.conversation.messages && queryData.regulation) {
              const updatedMessages = queryData.conversation.messages.map((msg, index) => {
                if (msg.role === 'assistant') {
                  return {
                    ...msg,
                    regulation: {
                      ...queryData.regulation,
                      query_type: queryData.regulation.query_type  // Preserve query_type
                    }
                  };
                }
                return msg;
              });
              queryData.conversation.messages = updatedMessages;
            }

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

  // 🔍 DEBUG: Log what we're passing to RegulationPanel with query_type awareness
  if (currentConversation?.messages) {
    console.log('🔍 DEBUGGING: Messages being passed to MessageList (with query_type):');
    currentConversation.messages.forEach((msg, index) => {
      console.log(`Message ${index}:`, {
        role: msg.role,
        hasRegulation: !!msg.regulation,
        queryType: msg.regulation?.query_type || 'none',
        regulationKeys: msg.regulation ? Object.keys(msg.regulation) : 'none',
        referencesCount: msg.regulation?.references?.length || 0,
        contentPreview: msg.content.substring(0, 50) + '...'
      });
    });
  }

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