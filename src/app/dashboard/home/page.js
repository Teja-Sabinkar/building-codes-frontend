// src/app/dashboard/home/page.js - Building Codes Assistant - FIXED WITH PROPER API URL HANDLING
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import RegulationPanel from '@/components/home/RegulationPanel/RegulationPanel';
import styles from './page.module.css';

// 🔧 FIX: Get backend URL with proper fallback
const getBackendUrl = () => {
  // First try the environment variable
  if (process.env.NEXT_PUBLIC_RAG_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_RAG_BACKEND_URL;
  }
  
  // Fallback for production if env var is missing
  // This ensures the code works even if Vercel environment variable isn't set
  return 'https://building-codes-backend.onrender.com';
};

const BACKEND_URL = getBackendUrl();

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Theme management
  const { theme, isDark, isLoading: isThemeLoading } = useTheme(user);

  // Core conversation state
  const [currentConversation, setCurrentConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  // DELETION TRACKING: Track conversations user has explicitly deleted
  const [deletedConversationIds, setDeletedConversationIds] = useState(new Set());
  const [deletionInitialized, setDeletionInitialized] = useState(false);

  // Regulation query data
  const [currentRegulationResult, setCurrentRegulationResult] = useState(null);

  // Log backend URL on mount (for debugging)
  useEffect(() => {
    console.log('🔧 Backend URL configured:', BACKEND_URL);
    console.log('🔧 Environment variable value:', process.env.NEXT_PUBLIC_RAG_BACKEND_URL || 'NOT SET');
  }, []);

  // Theme initialization
  useEffect(() => {
    if (!loading && !isThemeLoading && user) {
      console.log('🎨 Home page theme initialization:', {
        userTheme: user?.preferences?.theme,
        currentTheme: theme,
        isDark: isDark
      });

      const bodyHasDarkMode = document.body.classList.contains('dark-mode');
      console.log('✅ Theme applied to body:', bodyHasDarkMode ? 'dark' : 'light');
    }
  }, [user, loading, isThemeLoading, theme, isDark]);

  // HELPER FUNCTION: Get conversation display title (prioritize first user message)
  const getConversationDisplayTitle = (conversation) => {
    if (conversation?.messages && conversation.messages.length > 0) {
      const firstUserMessage = conversation.messages.find(msg => msg.role === 'user');
      if (firstUserMessage && firstUserMessage.content) {
        const content = firstUserMessage.content.trim();
        return content.length > 60 ? content.substring(0, 57) + '...' : content;
      }
    }
    return conversation?.title || 'New Regulation Query';
  };

  // DELETION TRACKING: Helper functions
  const loadDeletedConversationIds = () => {
    try {
      const deletedIds = localStorage.getItem('deletedConversationIds');
      console.log('📋 Raw localStorage deletedConversationIds:', deletedIds);

      if (deletedIds) {
        const parsed = JSON.parse(deletedIds);
        console.log('📋 Parsed deleted conversation IDs:', parsed);
        const deletedSet = new Set(parsed);
        setDeletedConversationIds(deletedSet);
        console.log('✅ Loaded deleted conversation IDs into state:', Array.from(deletedSet));
        return deletedSet;
      } else {
        console.log('📋 No deleted conversation IDs found in localStorage');
      }
    } catch (error) {
      console.error('❌ Error loading deleted conversation IDs:', error);
      localStorage.removeItem('deletedConversationIds');
    }

    const emptySet = new Set();
    setDeletedConversationIds(emptySet);
    console.log('📋 Initialized empty deleted conversations set');
    return emptySet;
  };

  const saveDeletedConversationIds = (deletedIds) => {
    try {
      const idsArray = Array.from(deletedIds);
      localStorage.setItem('deletedConversationIds', JSON.stringify(idsArray));
      console.log('💾 Saved deleted conversation IDs to localStorage:', idsArray);
    } catch (error) {
      console.error('❌ Error saving deleted conversation IDs:', error);
    }
  };

  const addDeletedConversationId = (conversationId) => {
    console.log('🗑️ Adding conversation to deleted list:', conversationId);

    setDeletedConversationIds(prev => {
      const newSet = new Set(prev);
      newSet.add(conversationId);
      saveDeletedConversationIds(newSet);
      console.log('✅ Updated deleted conversation IDs:', Array.from(newSet));
      return newSet;
    });
  };

  // Initialize deletion tracking ONCE on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !deletionInitialized) {
      console.log('🔧 Initializing deletion tracking...');
      loadDeletedConversationIds();
      setDeletionInitialized(true);
    }
  }, [deletionInitialized]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Load conversations on mount
  useEffect(() => {
    if (user && deletionInitialized) {
      console.log('🔍 User authenticated and deletion tracking initialized, loading conversations...');

      // Test localStorage functionality
      try {
        localStorage.setItem('test', 'test');
        const testValue = localStorage.getItem('test');
        localStorage.removeItem('test');
        console.log('✅ localStorage is working:', testValue === 'test');
      } catch (error) {
        console.error('❌ localStorage is not working:', error);
      }

      console.log('🔍 Current localStorage currentConversationId:', localStorage.getItem('currentConversationId'));
      console.log('🔍 Current deleted IDs state:', Array.from(deletedConversationIds));

      loadConversationsWithPersistence();
    }
  }, [user, deletionInitialized]);

  // Update regulation result when conversation changes
  useEffect(() => {
    if (currentConversation?.messages && currentConversation.messages.length > 0) {
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

  // Load conversations with persistence
  const loadConversationsWithPersistence = async () => {
    setIsLoadingConversations(true);
    try {
      console.log('🔄 Loading conversations with deletion persistence...');

      const currentDeletedIds = loadDeletedConversationIds();
      console.log('🗑️ Reloaded deleted conversations from localStorage:', Array.from(currentDeletedIds));

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const allConversations = data.conversations || [];

        console.log('📋 Active conversations from API:', {
          total: allConversations.length,
          archived: allConversations.filter(c => c.metadata?.isArchived).length,
          active: allConversations.filter(c => !c.metadata?.isArchived).length
        });

        // Filter out deleted and archived conversations
        const filteredConversations = allConversations.filter(conversation => {
          const isDeleted = currentDeletedIds.has(conversation._id);
          const isArchived = conversation.metadata?.isArchived;
          
          if (isDeleted) {
            console.log('⏭️ FILTERING OUT user-deleted conversation:', {
              id: conversation._id,
              title: conversation.title
            });
          }
          
          if (isArchived) {
            console.log('⏭️ FILTERING OUT archived conversation:', {
              id: conversation._id,
              title: conversation.title
            });
          }
          
          return !isDeleted && !isArchived;
        });

        console.log('📋 After deletion filtering:', {
          remaining: filteredConversations.length,
          filtered: allConversations.length - filteredConversations.length,
          deletedIds: Array.from(currentDeletedIds)
        });

        // Sort by last activity
        const sortedConversations = filteredConversations.sort((a, b) => {
          const aDate = new Date(a.updatedAt || a.createdAt);
          const bDate = new Date(b.updatedAt || b.createdAt);
          return bDate - aDate;
        });

        console.log('📋 Conversations loaded for sidebar:', sortedConversations.length);
        setConversations(sortedConversations);

        // Try to restore saved conversation
        const savedConversationId = localStorage.getItem('currentConversationId');
        
        if (savedConversationId) {
          console.log('🔍 Trying to restore saved conversation:', savedConversationId);
          
          const savedConversation = sortedConversations.find(c => c._id === savedConversationId);
          
          if (savedConversation) {
            console.log('✅ Successfully restored saved conversation:', {
              id: savedConversation._id,
              title: savedConversation.title
            });
            setCurrentConversation(savedConversation);
            localStorage.setItem('currentConversationId', savedConversation._id);
            console.log('💾 Set current conversation and saved to localStorage:', {
              id: savedConversation._id,
              title: savedConversation.title
            });
          } else {
            console.log('⚠️ Saved conversation not found in filtered list, selecting most recent');
            const mostRecent = sortedConversations[0];
            if (mostRecent) {
              setCurrentConversation(mostRecent);
              localStorage.setItem('currentConversationId', mostRecent._id);
            }
          }
        } else if (sortedConversations.length > 0) {
          console.log('📋 No saved conversation, selecting most recent');
          const mostRecent = sortedConversations[0];
          setCurrentConversation(mostRecent);
          localStorage.setItem('currentConversationId', mostRecent._id);
        }
      }
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Create new conversation
  const createNewConversation = async (regionData = null) => {
    try {
      console.log('🌍 Region selected:', regionData);
      console.log('🔄 Creating new conversation with region data:', regionData);

      const conversationData = {
        title: 'New Regulation Query',
      };

      if (regionData) {
        conversationData.region = regionData.code;
        const flag = regionData.flag || (regionData.code === 'Scotland' ? '🏴󠁧󠁢󠁳󠁣󠁴󠁿' : '🇮🇳');
        const name = regionData.name || (regionData.code === 'Scotland' ? 'Scottish Building Standards' : 'Indian Building Codes');
        
        conversationData.regionDisplayName = `${flag} ${name}`;
        conversationData.title = `New ${name} Query`;
      } else {
        conversationData.region = 'India';
        conversationData.regionDisplayName = '🇮🇳 Indian Building Codes';
      }

      console.log('✅ Region data processed:', {
        region: conversationData.region,
        regionDisplayName: conversationData.regionDisplayName,
        title: conversationData.title
      });

      const token = localStorage.getItem('authToken');
      console.log('🔄 Sending conversation creation request:', conversationData);

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversationData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Conversation created:', data);

        const newConversation = data.conversation;
        
        // 🔧 FIX: Set the conversation directly instead of searching in array
        // This works immediately, unlike selectConversation which relies on state update
        setCurrentConversation(newConversation);
        localStorage.setItem('currentConversationId', newConversation._id);
        
        // Add to conversations list
        setConversations(prev => [newConversation, ...prev]);
        
        console.log('✅ New conversation set as current:', {
          id: newConversation._id,
          title: newConversation.title
        });
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to create conversation:', errorData);
      }
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
    }
  };

  // Select conversation
  const selectConversation = (conversationId) => {
    console.log('🔄 Selecting conversation:', {
      id: conversationId,
      title: conversations.find(c => c._id === conversationId)?.title
    });

    const conversation = conversations.find(c => c._id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
      localStorage.setItem('currentConversationId', conversationId);
      console.log('💾 Saved conversation to localStorage:', conversationId);

      const latestRegulationMessage = conversation.messages
        ?.slice().reverse()
        .find(msg => msg.regulation && msg.regulation.answer);
      
      if (latestRegulationMessage) {
        setCurrentRegulationResult(latestRegulationMessage.regulation);
      } else {
        setCurrentRegulationResult(null);
      }

      console.log('🔄 Selected conversation:', {
        id: conversation._id,
        title: conversation.title,
        messageCount: conversation.messages?.length || 0,
        messagesWithRegulation: conversation.messages?.filter(m => m.regulation).length || 0
      });
    }
  };

  // Delete conversation
  const deleteConversation = async (conversationId) => {
    console.log('🗑️ Attempting to delete conversation:', conversationId);
    
    // Add to deleted list IMMEDIATELY
    addDeletedConversationId(conversationId);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/conversations?id=${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Conversation deleted from database');

        // Filter out the deleted conversation
        const updatedConversations = conversations.filter(c => c._id !== conversationId);
        setConversations(updatedConversations);

        // If deleted conversation was current, select another
        if (currentConversation?._id === conversationId) {
          if (updatedConversations.length > 0) {
            selectConversation(updatedConversations[0]._id);
          } else {
            setCurrentConversation(null);
            localStorage.removeItem('currentConversationId');
          }
        }
      } else {
        console.error('❌ Failed to delete conversation from database');
      }
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
    }
  };

  // Send message
  const sendMessage = async (message) => {
    if (!currentConversation || !message.trim()) return;

    console.log('📤 Sending regulation query:', message);

    try {
      setIsGenerating(true);
      const token = localStorage.getItem('authToken');
      const conversation = currentConversation;

      // STEP 1: Add user message to conversation via Next.js API
      console.log('🔍 Step 1: Adding user message to conversation...');
      const addUserResponse = await fetch('/api/messages/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversation._id,
          content: message,
          role: 'user',
        }),
      });

      if (!addUserResponse.ok) {
        throw new Error('Failed to add user message');
      }

      const updatedUserConversation = await addUserResponse.json();
      console.log('✅ User message added to conversation');

      // STEP 1.5: Prepare conversation history for context
      console.log('🧠 Preparing conversation history for context...');

      const conversationHistory = [];
      if (conversation.messages && conversation.messages.length > 0) {
        const recentMessages = conversation.messages.slice(-4);
        
        for (const msg of recentMessages) {
          conversationHistory.push({
            role: msg.role,
            content: msg.content
          });
        }
      }

      conversationHistory.push({
        role: 'user',
        content: message
      });

      console.log('🧠 Conversation history prepared:', {
        historyLength: conversationHistory.length,
        messages: conversationHistory.map(msg => `${msg.role}: ${msg.content.substring(0, 50)}...`)
      });

      // STEP 2: Send query to Python backend - 🔧 FIXED: Use constant instead of env var
      console.log('🤖 Step 2: Sending query to Python backend with conversation context...');
      console.log('🔧 Using backend URL:', BACKEND_URL);
      
      const aiResponse = await fetch(`${BACKEND_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message,
          conversationId: conversation._id,
          region: conversation.region || 'India',
          maxResults: 10,
          conversation_history: conversationHistory
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('❌ Backend response error:', {
          status: aiResponse.status,
          statusText: aiResponse.statusText,
          body: errorText
        });
        throw new Error('AI processing failed');
      }

      const aiData = await aiResponse.json();
      console.log('🔍 AI Response received with context:', {
        hasRegulation: !!aiData.regulation,
        queryType: aiData.regulation?.query_type,
        referencesCount: aiData.regulation?.references?.length,
        usedConversationContext: conversationHistory.length > 1
      });

      // STEP 3: Add assistant message
      console.log('💾 Step 3: Adding assistant message with regulation data...');
      const addAssistantResponse = await fetch('/api/messages/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversation._id,
          content: aiData.regulation?.answer || 'No response generated',
          role: 'assistant',
          regulation: {
            ...aiData.regulation,
            query_type: aiData.regulation?.query_type || 'building_codes'
          }
        }),
      });

      if (!addAssistantResponse.ok) {
        throw new Error('Failed to add assistant message to conversation');
      }

      const finalConversationData = await addAssistantResponse.json();
      console.log('✅ Complete conversation flow finished:', {
        conversationId: finalConversationData.conversation._id,
        messageCount: finalConversationData.conversation.messages.length
      });

      // Update state
      const enhancedConversation = {
        ...finalConversationData.conversation,
        messages: finalConversationData.conversation.messages.map(msg => {
          if (msg.role === 'assistant' && msg.regulation) {
            return {
              ...msg,
              regulation: {
                ...msg.regulation,
                query_type: msg.regulation.query_type || 'building_codes'
              }
            };
          }
          return msg;
        })
      };

      setCurrentConversation(enhancedConversation);
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv._id === conversation._id ? enhancedConversation : conv
        )
      );

      if (aiData.regulation) {
        setCurrentRegulationResult(aiData.regulation);
      }

    } catch (error) {
      console.error('❌ Error in message flow:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Edit message
  const handleEditMessage = async (messageId, newContent) => {
    if (!currentConversation) return;

    console.log('✏️ Editing message:', { messageId, newContent });

    try {
      setIsGenerating(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch('/api/messages/edit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: currentConversation._id,
          messageId,
          newContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit message');
      }

      const data = await response.json();
      console.log('✅ Message edited successfully:', data);

      setCurrentConversation(data.conversation);
      setConversations(prev =>
        prev.map(conv =>
          conv._id === data.conversation._id ? data.conversation : conv
        )
      );

      // Trigger regeneration if needed
      if (data.shouldRegenerate) {
        console.log('🔄 Triggering regeneration...');
        setIsGenerating(true);

        try {
          // 🔧 FIXED: Use constant instead of env var
          const queryResponse = await fetch(`${BACKEND_URL}/api/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              question: newContent,
              conversationId: currentConversation._id,
              maxResults: 10,
              isRegeneration: true
            }),
          });

          if (queryResponse.ok) {
            const regenerationData = await queryResponse.json();

            if (regenerationData && regenerationData.conversation && regenerationData.regulation) {
              console.log('✅ Regeneration completed:', {
                conversation: !!regenerationData.conversation,
                regulation: !!regenerationData.regulation
              });

              const preservedTitle = getConversationDisplayTitle(currentConversation);
              const updatedConversationFromBackend = regenerationData.conversation;
              updatedConversationFromBackend.title = preservedTitle;

              const enhancedMessages = updatedConversationFromBackend.messages.map((msg, index) => {
                if (msg.role === 'assistant' && index === updatedConversationFromBackend.messages.length - 1) {
                  return {
                    ...msg,
                    _id: msg._id || msg.id,
                    timestamp: new Date().toISOString(),
                    regulation: {
                      ...regenerationData.regulation,
                      query_type: regenerationData.regulation.query_type || 'building_codes'
                    }
                  };
                }
                return {
                  ...msg,
                  regulation: msg.regulation || undefined
                };
              });

              const finalConversation = {
                ...updatedConversationFromBackend,
                messages: enhancedMessages,
                title: preservedTitle
              };

              console.log('🔧 Final conversation processed:', {
                title: finalConversation.title,
                messageCount: finalConversation.messages.length,
                lastMessageHasId: !!finalConversation.messages[finalConversation.messages.length - 1]._id,
                lastMessageTimestamp: finalConversation.messages[finalConversation.messages.length - 1].timestamp
              });

              setConversations(prevConversations =>
                prevConversations.map(conv =>
                  conv._id === currentConversation._id ? finalConversation : conv
                )
              );

              setCurrentConversation(finalConversation);
              localStorage.setItem('currentConversationId', finalConversation._id);

              console.log('✅ Regeneration completed with preserved title and proper IDs');

              if (regenerationData.regulation) {
                setCurrentRegulationResult(regenerationData.regulation);
              }
            }
          } else {
            const errorData = await queryResponse.json();
            console.error('❌ Regeneration failed:', errorData);
            throw new Error('Failed to regenerate response');
          }
        } catch (regenError) {
          console.error('❌ Regeneration error:', regenError);
        } finally {
          setIsGenerating(false);
        }
      }

    } catch (error) {
      console.error('❌ Error editing message:', error);
      setIsGenerating(false);
      throw error;
    }
  };

  // Update conversation
  const updateConversation = (updatedConversation) => {
    console.log('🔄 Updating conversation in state:', {
      id: updatedConversation._id,
      newTitle: updatedConversation.title
    });

    if (currentConversation && currentConversation._id === updatedConversation._id) {
      setCurrentConversation(updatedConversation);
    }

    setConversations(prev =>
      prev.map(conv =>
        conv._id === updatedConversation._id ? updatedConversation : conv
      )
    );
  };

  // Debug function
  const debugDeletionTracking = () => {
    console.log('🔍 DELETION TRACKING DEBUG:');
    console.log('localStorage raw value:', localStorage.getItem('deletedConversationIds'));
    console.log('Current state:', Array.from(deletedConversationIds));
    console.log('Current conversation:', currentConversation?._id);
    console.log('Available conversations:', conversations.map(c => c._id));
    console.log('Deletion initialized:', deletionInitialized);
  };

  if (typeof window !== 'undefined') {
    window.debugDeletionTracking = debugDeletionTracking;
  }

  // Show loading
  if (loading || isLoadingConversations || isThemeLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>{loading ? 'Loading...' : isThemeLoading ? 'Loading theme...' : 'Loading conversations...'}</p>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
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