// src/app/dashboard/home/page.js - Building Codes Assistant - FIXED WITH THEME INITIALIZATION
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme'; // 🆕 ADD THEME HOOK
import RegulationPanel from '@/components/home/RegulationPanel/RegulationPanel';
import styles from './page.module.css';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 🆕 ADD THEME MANAGEMENT
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

  // 🆕 THEME INITIALIZATION - Apply theme on mount and when user/theme changes
  useEffect(() => {
    if (!loading && !isThemeLoading && user) {
      console.log('🎨 Home page theme initialization:', {
        userTheme: user?.preferences?.theme,
        currentTheme: theme,
        isDark: isDark
      });

      // The useTheme hook already applies the theme to document.body
      // This is just for logging/verification
      const bodyHasDarkMode = document.body.classList.contains('dark-mode');
      console.log('✅ Theme applied to body:', bodyHasDarkMode ? 'dark' : 'light');
    }
  }, [user, loading, isThemeLoading, theme, isDark]);

  // HELPER FUNCTION: Get conversation display title (prioritize first user message)
  const getConversationDisplayTitle = (conversation) => {
    // Always prioritize first user message over stored title
    if (conversation?.messages && conversation.messages.length > 0) {
      const firstUserMessage = conversation.messages.find(msg => msg.role === 'user');
      if (firstUserMessage && firstUserMessage.content) {
        const content = firstUserMessage.content.trim();
        return content.length > 60 ? content.substring(0, 57) + '...' : content;
      }
    }
    return conversation?.title || 'New Regulation Query';
  };

  // DELETION TRACKING: Helper functions for managing deleted conversation IDs
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
      // Clear corrupted data
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

  // Load conversations on mount - ONLY after deletion tracking is initialized
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
  }, [user, deletionInitialized]); // Added deletionInitialized dependency

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

  // ENHANCED loadConversationsWithPersistence function - FIXED with double-filtering safety
  const loadConversationsWithPersistence = async () => {
    setIsLoadingConversations(true);
    try {
      console.log('🔄 Loading conversations with deletion persistence...');

      // FIX: Always reload from localStorage to ensure we have the latest deleted IDs
      const currentDeletedIds = loadDeletedConversationIds();
      console.log('🗑️ Reloaded deleted conversations from localStorage:', Array.from(currentDeletedIds));

      // 🔧 CRITICAL FIX: Load only NON-ARCHIVED conversations initially
      // This prevents cleared conversations from showing up
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/conversations', {  // ← REMOVED includeArchived=true
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

        // Filter out user-deleted conversations FIRST
        const nonDeletedConversations = allConversations.filter(conversation => {
          const isDeleted = currentDeletedIds.has(conversation._id);
          if (isDeleted) {
            console.log('⭐ FILTERING OUT user-deleted conversation:', {
              id: conversation._id,
              title: conversation.title
            });
          }
          return !isDeleted;
        });

        console.log('📋 After deletion filtering:', {
          remaining: nonDeletedConversations.length,
          filtered: allConversations.length - nonDeletedConversations.length,
          deletedIds: Array.from(currentDeletedIds)
        });

        // 🆕 CRITICAL FIX: Handle zero conversations case properly
        if (nonDeletedConversations.length === 0) {
          console.log('🚫 ZERO CONVERSATIONS AFTER FILTERING - Showing empty state');

          // Set empty state
          setConversations([]);
          setCurrentConversation(null);
          setCurrentRegulationResult(null);

          // Ensure no conversation is saved in localStorage
          localStorage.removeItem('currentConversationId');

          console.log('✅ Empty state activated - user must create new conversation');
          setIsLoadingConversations(false);
          return; // Exit early - don't try to restore any conversations
        }

        // CRITICAL: Ensure all messages have their regulation data properly attached
        const conversationsWithRegulationData = nonDeletedConversations.map(conversation => {
          if (conversation.messages && conversation.messages.length > 0) {
            const enhancedMessages = conversation.messages.map(message => {
              // Ensure assistant messages retain their regulation data
              if (message.role === 'assistant' && message.regulation) {
                return {
                  ...message,
                  regulation: {
                    ...message.regulation,
                    query_type: message.regulation.query_type || 'building_codes'
                  }
                };
              }
              return message;
            });

            return {
              ...conversation,
              messages: enhancedMessages
            };
          }
          return conversation;
        });

        // Set conversations (these are already non-archived)
        setConversations(conversationsWithRegulationData);

        console.log('📋 Conversations loaded for sidebar:', conversationsWithRegulationData.length);

        // Enhanced conversation restoration logic
        let conversationToSet = null;

        // Method 1: Try to restore saved conversation (if not deleted)
        const savedConversationId = localStorage.getItem('currentConversationId');
        if (savedConversationId) {
          console.log('🔍 Trying to restore saved conversation:', savedConversationId);

          // Check if saved conversation was deleted by user
          if (currentDeletedIds.has(savedConversationId)) {
            console.log('❌ Saved conversation was deleted by user, clearing localStorage');
            localStorage.removeItem('currentConversationId');
          } else {
            // Look for the saved conversation in available conversations
            conversationToSet = conversationsWithRegulationData.find(c => c._id === savedConversationId);

            if (conversationToSet) {
              console.log('✅ Successfully restored saved conversation:', {
                id: conversationToSet._id,
                title: conversationToSet.title
              });
            } else {
              console.log('❌ Saved conversation not found in available conversations');
              localStorage.removeItem('currentConversationId');
            }
          }
        }

        // Method 2: If no saved conversation, use most recent available
        if (!conversationToSet && conversationsWithRegulationData.length > 0) {
          conversationToSet = conversationsWithRegulationData[0];
          console.log('🔄 Using most recent available conversation:', {
            id: conversationToSet._id,
            title: conversationToSet.title
          });
        }

        // Set the current conversation and update localStorage
        if (conversationToSet) {
          setCurrentConversation(conversationToSet);
          localStorage.setItem('currentConversationId', conversationToSet._id);

          console.log('💾 Set current conversation and saved to localStorage:', {
            id: conversationToSet._id,
            title: conversationToSet.title
          });
        } else {
          console.log('🔍 No available conversations found, user will need to create new one');
          localStorage.removeItem('currentConversationId');
          setCurrentConversation(null);
        }

      } else {
        console.error('❌ Failed to load conversations:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const createNewConversation = async (regionData = null) => {
    try {
      console.log('🔄 Creating new conversation with region data:', regionData);

      // Build conversation data with proper defaults
      const conversationData = {
        title: 'New Regulation Query',
      };

      if (regionData && regionData.code) {
        // Valid region data provided
        conversationData.region = regionData.code;

        // 🔧 FIX: Safely construct regionDisplayName
        const flag = regionData.flag || (regionData.code === 'Scotland' ? '🏴󠁧󠁢󠁳󠁣󠁴󠁿' : '🇮🇳');
        const name = regionData.name || (regionData.code === 'Scotland' ? 'Scottish Building Standards' : 'Indian Building Codes');

        conversationData.regionDisplayName = `${flag} ${name}`;
        conversationData.title = `New ${name} Query`;

        console.log('✅ Region data processed:', {
          region: conversationData.region,
          regionDisplayName: conversationData.regionDisplayName,
          title: conversationData.title
        });
      } else {
        // No region data or invalid region data - use defaults
        conversationData.region = 'India';
        conversationData.regionDisplayName = '🇮🇳 Indian Building Codes';
        conversationData.title = 'New Indian Building Codes Query';

        console.log('ℹ️ Using default region data (India)');
      }

      // Get auth token
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('🔄 Sending conversation creation request:', conversationData);

      // Create conversation via API
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(conversationData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create conversation (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Conversation created:', data.conversation);

      // Add to local state and select it
      const newConversation = data.conversation;
      setConversations(prev => [newConversation, ...prev]);

      // Set as current conversation
      await selectConversation(newConversation);

      return newConversation;

    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      throw error;
    }
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
      // STEP 1: Add user message to conversation via Next.js API
      console.log('🔍 Step 1: Adding user message to conversation...');
      const token = localStorage.getItem('authToken');
      const addMessageResponse = await fetch('/api/messages/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversation._id,
          content: message,
          role: 'user'
        }),
      });

      if (!addMessageResponse.ok) {
        throw new Error('Failed to add user message to conversation');
      }

      const addMessageData = await addMessageResponse.json();
      console.log('✅ User message added to conversation');

      // STEP 2: Send query to Python backend for AI processing
      console.log('🤖 Step 2: Sending query to Python backend for AI processing...');
      const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message,
          conversationId: conversation._id,
          region: conversation.region || 'India',
          maxResults: 10
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('AI processing failed');
      }

      const aiData = await aiResponse.json();
      console.log('🔍 AI Response received:', {
        hasRegulation: !!aiData.regulation,
        queryType: aiData.regulation?.query_type,
        referencesCount: aiData.regulation?.references?.length
      });

      // STEP 3: Add assistant message with regulation data to conversation via Next.js API
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
      console.log('✅ Complete conversation updated');

      // STEP 4: Update frontend state with the complete conversation while preserving all regulation data
      const updatedConversation = finalConversationData.conversation;

      // CRITICAL: Ensure ALL messages retain their regulation data, not just the latest one
      if (updatedConversation.messages && updatedConversation.messages.length > 0) {
        const enhancedMessages = updatedConversation.messages.map((message, index) => {
          if (message.role === 'assistant') {
            // For the latest assistant message, use the fresh AI data
            if (index === updatedConversation.messages.length - 1 && aiData.regulation) {
              console.log('🔧 Attaching fresh regulation data to latest message:', {
                queryType: aiData.regulation.query_type,
                referencesCount: aiData.regulation.references?.length || 0
              });
              return {
                ...message,
                regulation: {
                  ...aiData.regulation,
                  query_type: aiData.regulation.query_type
                }
              };
            }
            // For previous assistant messages, preserve existing regulation data
            else if (message.regulation) {
              console.log('🔧 Preserving existing regulation data for previous message:', {
                hasReferences: !!message.regulation.references,
                referencesCount: message.regulation.references?.length || 0,
                queryType: message.regulation.query_type
              });
              return {
                ...message,
                regulation: {
                  ...message.regulation,
                  query_type: message.regulation.query_type || 'building_codes'
                }
              };
            }
          }
          return message;
        });

        updatedConversation.messages = enhancedMessages;
        console.log('✅ All regulation data preserved across messages:', {
          totalMessages: enhancedMessages.length,
          messagesWithRegulation: enhancedMessages.filter(m => m.regulation && m.regulation.references?.length > 0).length
        });
      }

      // Update conversation state with enhanced messages
      setCurrentConversation(updatedConversation);
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv._id === updatedConversation._id) {
            // Ensure the updated conversation in the list also has all regulation data
            return updatedConversation;
          }
          return conv;
        });
        // If this is a new conversation, add it
        if (!prev.find(conv => conv._id === updatedConversation._id)) {
          return [updatedConversation, ...prev];
        }
        return updated;
      });

      // Update current regulation result
      if (aiData.regulation) {
        setCurrentRegulationResult(aiData.regulation);
      }

      // PERSISTENCE: Save current conversation
      try {
        localStorage.setItem('currentConversationId', updatedConversation._id);
        console.log('💾 Message sent - saved conversation to localStorage:', updatedConversation._id);
      } catch (error) {
        console.error('❌ Failed to save conversation to localStorage:', error);
      }

    } catch (error) {
      console.error('❌ Error in message flow:', error);

      // If there was an error, we should still try to update the conversation list
      // in case the user message was added successfully
      try {
        await loadConversationsWithPersistence();
      } catch (reloadError) {
        console.error('❌ Failed to reload conversations after error:', reloadError);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const selectConversation = (conversation) => {
    console.log('🔄 Selecting conversation:', {
      id: conversation._id,
      title: conversation.title,
      messageCount: conversation.messages?.length || 0,
      messagesWithRegulation: conversation.messages?.filter(m => m.regulation && m.regulation.references?.length > 0).length || 0
    });

    // CRITICAL: Ensure regulation data is preserved when selecting conversations
    let conversationWithRegulationData = conversation;
    if (conversation.messages && conversation.messages.length > 0) {
      const enhancedMessages = conversation.messages.map(message => {
        if (message.role === 'assistant' && message.regulation) {
          console.log('🔧 Preserving regulation data during conversation selection:', {
            hasReferences: !!message.regulation.references,
            referencesCount: message.regulation.references?.length || 0,
            queryType: message.regulation.query_type
          });
          return {
            ...message,
            regulation: {
              ...message.regulation,
              query_type: message.regulation.query_type || 'building_codes'
            }
          };
        }
        return message;
      });

      conversationWithRegulationData = {
        ...conversation,
        messages: enhancedMessages
      };
    }

    setCurrentConversation(conversationWithRegulationData);

    // PERSISTENCE: Save selected conversation
    try {
      localStorage.setItem('currentConversationId', conversation._id);
      console.log('💾 Saved conversation to localStorage:', conversation._id);
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
    }

    // Find latest regulation result in this conversation
    if (conversationWithRegulationData.messages && conversationWithRegulationData.messages.length > 0) {
      const latestRegulationMessage = conversationWithRegulationData.messages
        .slice().reverse()
        .find(msg => msg.regulation && msg.regulation.answer);

      if (latestRegulationMessage) {
        console.log('🔧 Setting current regulation result from conversation:', {
          hasReferences: !!latestRegulationMessage.regulation.references,
          referencesCount: latestRegulationMessage.regulation.references?.length || 0
        });
        setCurrentRegulationResult(latestRegulationMessage.regulation);
      } else {
        setCurrentRegulationResult(null);
      }
    }
  };

  // ENHANCED deleteConversation with proper deletion tracking
  const deleteConversation = async (conversationId) => {
    try {
      console.log('🗑️ Starting deletion process for conversation:', conversationId);

      // 🔧 CRITICAL FIX: Add to deleted list FIRST and SYNCHRONOUSLY
      // This must happen before any async operations or state changes
      try {
        const currentDeletedIds = localStorage.getItem('deletedConversationIds');
        const deletedArray = currentDeletedIds ? JSON.parse(currentDeletedIds) : [];

        if (!deletedArray.includes(conversationId)) {
          deletedArray.push(conversationId);
          localStorage.setItem('deletedConversationIds', JSON.stringify(deletedArray));
          console.log('💾 IMMEDIATELY saved to localStorage. Total deleted:', deletedArray.length);

          // Update React state as well
          setDeletedConversationIds(new Set(deletedArray));
          console.log('✅ Updated React state with deleted conversation');
        } else {
          console.log('⚠️ Conversation already in deleted list');
        }
      } catch (error) {
        console.error('❌ CRITICAL ERROR: Failed to add to deleted list:', error);
        // Still continue with deletion, but this is a serious issue
      }

      // Now proceed with the backend deletion
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/conversations?id=${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Backend deletion successful');

        // Update UI state immediately
        const updatedConversations = conversations.filter(conv => conv._id !== conversationId);
        setConversations(updatedConversations);

        // 🆕 CRITICAL: Handle last conversation deletion properly
        if (updatedConversations.length === 0) {
          console.log('🚫 LAST CONVERSATION DELETED - Setting empty state');

          // Clear current conversation completely
          setCurrentConversation(null);
          setCurrentRegulationResult(null);

          // 🔧 KEY FIX: Clear localStorage to prevent restoration
          localStorage.removeItem('currentConversationId');

          console.log('✅ Empty state activated - will persist through page reloads');
        } else {
          // Handle non-last conversation deletion
          if (currentConversation?._id === conversationId) {
            console.log('🔄 Deleted conversation was current, selecting new one...');
            const newCurrent = updatedConversations[0];
            setCurrentConversation(newCurrent);
            localStorage.setItem('currentConversationId', newCurrent._id);
            console.log('✅ Selected new current conversation:', newCurrent._id);
          }
        }

        console.log('✅ Deletion completed and tracked. Conversation will NOT reappear on reload.');

        // Verify the deletion was tracked
        const verifyDeleted = JSON.parse(localStorage.getItem('deletedConversationIds') || '[]');
        console.log('🔍 Verification - Total deleted conversations:', verifyDeleted.length);
        console.log('🔍 Verification - Is deleted conversation in list?', verifyDeleted.includes(conversationId));

      } else {
        throw new Error('Failed to delete conversation from backend');
      }
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
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
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/messages/edit', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
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
            const regenerationData = await queryResponse.json();

            // FIXED REGENERATION CODE - Apply the requested fixes
            if (regenerationData && regenerationData.conversation && regenerationData.regulation) {
              console.log('✅ Regeneration completed:', {
                conversation: !!regenerationData.conversation,
                regulation: !!regenerationData.regulation
              });

              // CRITICAL FIX 1: Preserve the conversation title from the first user message
              const preservedTitle = getConversationDisplayTitle(currentConversation);

              // CRITICAL FIX 2: Process the updated conversation while preserving title
              const updatedConversationFromBackend = regenerationData.conversation;

              // Override backend title with preserved title
              updatedConversationFromBackend.title = preservedTitle;

              // CRITICAL FIX 3: Ensure the assistant message gets proper regulation data AND database ID
              const enhancedMessages = updatedConversationFromBackend.messages.map((msg, index) => {
                if (msg.role === 'assistant' && index === updatedConversationFromBackend.messages.length - 1) {
                  // This is the new assistant message - enhance it with regulation data
                  return {
                    ...msg,
                    _id: msg._id || msg.id, // Preserve database ID if it exists
                    timestamp: new Date().toISOString(),
                    regulation: {
                      ...regenerationData.regulation,
                      query_type: regenerationData.regulation.query_type || 'building_codes'
                    }
                  };
                }
                // For all other messages, preserve existing data
                return {
                  ...msg,
                  regulation: msg.regulation || undefined
                };
              });

              // Update the conversation with enhanced messages and preserved title
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

              // Update state
              setConversations(prevConversations =>
                prevConversations.map(conv =>
                  conv._id === currentConversation._id ? finalConversation : conv
                )
              );

              setCurrentConversation(finalConversation);

              // Save to localStorage with preserved title
              localStorage.setItem('currentConversationId', finalConversation._id);

              console.log('✅ Regeneration completed with preserved title and proper IDs');

              // Update current regulation result if a new one was generated
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

  // DEBUG function to check deletion tracking (remove in production)
  const debugDeletionTracking = () => {
    console.log('🔍 DELETION TRACKING DEBUG:');
    console.log('localStorage raw value:', localStorage.getItem('deletedConversationIds'));
    console.log('Current state:', Array.from(deletedConversationIds));
    console.log('Current conversation:', currentConversation?._id);
    console.log('Available conversations:', conversations.map(c => c._id));
    console.log('Deletion initialized:', deletionInitialized);
  };

  // Make debug function available in console (remove in production)
  if (typeof window !== 'undefined') {
    window.debugDeletionTracking = debugDeletionTracking;
  }

  // Show loading while checking authentication or loading conversations
  if (loading || isLoadingConversations || isThemeLoading) { // 🆕 ADD THEME LOADING
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>{loading ? 'Loading...' : isThemeLoading ? 'Loading theme...' : 'Loading conversations...'}</p>
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