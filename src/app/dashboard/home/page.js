// src/app/dashboard/home/page.js - Building Codes Assistant - FIXED CONVERSATION DELETION PERSISTENCE
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
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  // 🆕 DELETION TRACKING: Track conversations user has explicitly deleted
  const [deletedConversationIds, setDeletedConversationIds] = useState(new Set());

  // Regulation query data
  const [currentRegulationResult, setCurrentRegulationResult] = useState(null);

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

  // 🆕 DELETION TRACKING: Helper functions for managing deleted conversation IDs
  const loadDeletedConversationIds = () => {
    try {
      const deletedIds = localStorage.getItem('deletedConversationIds');
      if (deletedIds) {
        const parsed = JSON.parse(deletedIds);
        setDeletedConversationIds(new Set(parsed));
        console.log('📋 Loaded deleted conversation IDs:', parsed);
        return new Set(parsed);
      }
    } catch (error) {
      console.error('❌ Error loading deleted conversation IDs:', error);
    }
    return new Set();
  };

  const saveDeletedConversationIds = (deletedIds) => {
    try {
      const idsArray = Array.from(deletedIds);
      localStorage.setItem('deletedConversationIds', JSON.stringify(idsArray));
      console.log('💾 Saved deleted conversation IDs:', idsArray);
    } catch (error) {
      console.error('❌ Error saving deleted conversation IDs:', error);
    }
  };

  const addDeletedConversationId = (conversationId) => {
    setDeletedConversationIds(prev => {
      const newSet = new Set(prev);
      newSet.add(conversationId);
      saveDeletedConversationIds(newSet);
      return newSet;
    });
  };

  // 🆕 DELETION TRACKING: Check if a conversation should be skipped during restoration
  const shouldSkipConversation = (conversation, deletedIds) => {
    // Skip if user explicitly deleted this conversation
    if (deletedIds.has(conversation._id)) {
      console.log('⏭️ Skipping user-deleted conversation:', {
        id: conversation._id,
        title: conversation.title
      });
      return true;
    }
    return false;
  };

  // Initialize deleted conversation IDs on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadDeletedConversationIds();
    }
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Load conversations on mount - FIXED VERSION WITH DELETION TRACKING
  useEffect(() => {
    if (user) {
      // Add some debugging and localStorage test
      console.log('🔍 User authenticated, loading conversations...');

      // Test localStorage functionality
      try {
        localStorage.setItem('test', 'test');
        const testValue = localStorage.getItem('test');
        localStorage.removeItem('test');
        console.log('✅ localStorage is working:', testValue === 'test');
      } catch (error) {
        console.error('❌ localStorage is not working:', error);
      }

      console.log('🔍 Current localStorage value:', localStorage.getItem('currentConversationId'));
      loadConversationsWithPersistence();
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

  // FIXED: Load conversations with proper persistence logic, regulation data preservation, AND deletion tracking
  const loadConversationsWithPersistence = async () => {
    setIsLoadingConversations(true);
    try {
      console.log('🔄 Loading conversations with persistence...');

      // Get current deleted conversation IDs
      const deletedIds = loadDeletedConversationIds();

      // Load ALL conversations (including archived for current session)
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/conversations?includeArchived=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const allConversations = data.conversations || [];

        console.log('📋 Loaded conversations:', {
          total: allConversations.length,
          archived: allConversations.filter(c => c.metadata?.isArchived).length,
          active: allConversations.filter(c => !c.metadata?.isArchived).length,
          deleted: allConversations.filter(c => deletedIds.has(c._id)).length
        });

        // CRITICAL: Ensure all messages have their regulation data properly attached
        const conversationsWithRegulationData = allConversations.map(conversation => {
          if (conversation.messages && conversation.messages.length > 0) {
            const enhancedMessages = conversation.messages.map(message => {
              // Ensure assistant messages retain their regulation data
              if (message.role === 'assistant' && message.regulation) {
                console.log('🔧 Preserving regulation data for message:', {
                  hasAnswer: !!message.regulation.answer,
                  hasReferences: !!message.regulation.references,
                  referencesCount: message.regulation.references?.length || 0,
                  queryType: message.regulation.query_type
                });
                return {
                  ...message,
                  regulation: {
                    ...message.regulation,
                    // Ensure query_type is preserved
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

        // 🆕 DELETION TRACKING: Filter out user-deleted conversations from sidebar display
        const nonDeletedConversations = conversationsWithRegulationData.filter(c => 
          !deletedIds.has(c._id)
        );

        // Filter conversations for sidebar display (only non-archived AND non-deleted)
        const activeConversations = nonDeletedConversations.filter(c => !c.metadata?.isArchived);
        setConversations(activeConversations);

        // ENHANCED PERSISTENCE LOGIC WITH DELETION TRACKING: Try multiple approaches to restore conversation
        let conversationToSet = null;

        // Method 1: Try to get conversation ID from localStorage
        const savedConversationId = localStorage.getItem('currentConversationId');
        if (savedConversationId) {
          console.log('🔍 Trying to restore saved conversation:', savedConversationId);

          // 🆕 DELETION TRACKING: Check if saved conversation was deleted by user
          if (deletedIds.has(savedConversationId)) {
            console.log('❌ Saved conversation was deleted by user, clearing localStorage');
            localStorage.removeItem('currentConversationId');
          } else {
            // Look for the saved conversation in ALL conversations (including archived but not deleted)
            conversationToSet = nonDeletedConversations.find(c => c._id === savedConversationId);

            if (conversationToSet) {
              console.log('✅ Restored saved conversation:', {
                id: conversationToSet._id,
                title: conversationToSet.title,
                isArchived: conversationToSet.metadata?.isArchived,
                messageCount: conversationToSet.messages?.length || 0,
                firstMessage: conversationToSet.messages?.[0]?.content?.substring(0, 50) + '...',
                regulationMessages: conversationToSet.messages?.filter(m => m.regulation && m.regulation.references?.length > 0).length || 0
              });
            } else {
              console.log('❌ Saved conversation not found in database');
              // Clean up invalid localStorage entry
              localStorage.removeItem('currentConversationId');
            }
          }
        }

        // Method 2: If no saved conversation or saved one not found, use most recent active (non-deleted) conversation
        if (!conversationToSet && activeConversations.length > 0) {
          conversationToSet = activeConversations[0]; // Most recent first (API sorts by updatedAt: -1)
          console.log('🔄 Using most recent active (non-deleted) conversation:', {
            id: conversationToSet._id,
            title: conversationToSet.title,
            lastUpdated: conversationToSet.updatedAt
          });
        }

        // Method 3: If still no conversation, check if there are any non-deleted conversations at all
        if (!conversationToSet && nonDeletedConversations.length > 0) {
          // Use the most recent non-deleted conversation even if archived
          conversationToSet = nonDeletedConversations[0];
          console.log('🔄 Using most recent non-deleted conversation (possibly archived):', {
            id: conversationToSet._id,
            title: conversationToSet.title,
            isArchived: conversationToSet.metadata?.isArchived
          });
        }

        // Set the current conversation and update localStorage
        if (conversationToSet) {
          setCurrentConversation(conversationToSet);
          // Save to localStorage for future page loads
          localStorage.setItem('currentConversationId', conversationToSet._id);

          console.log('💾 Set current conversation and saved to localStorage:', {
            id: conversationToSet._id,
            title: conversationToSet.title,
            messagesWithRegulation: conversationToSet.messages?.filter(m => m.regulation && m.regulation.references?.length > 0).length || 0
          });

          // If the restored conversation is archived, add it to the conversations list temporarily
          if (conversationToSet.metadata?.isArchived) {
            console.log('📌 Adding archived conversation to active list for current session');
            setConversations(prev => [conversationToSet, ...prev]);
          }
        } else {
          console.log('📝 No available conversations found (all may be deleted), user will need to create new one');
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

  const createNewConversation = async () => {
    try {
      console.log('🆕 Creating new conversation...');
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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

        // Save new conversation as current
        localStorage.setItem('currentConversationId', newConversation._id);

        console.log('✅ New conversation created and set as current:', {
          id: newConversation._id,
          title: newConversation.title
        });

        return newConversation;
      }
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
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
      // STEP 1: Add user message to conversation via Next.js API
      console.log('📝 Step 1: Adding user message to conversation...');
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
          maxResults: 10  // Request 10 results to get chunks 1-3 + 4-8 for references
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

      // PERSISTENCE: Save current conversation (ENHANCED)
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

    // PERSISTENCE: Save selected conversation (ENHANCED)
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

  // 🆕 DELETION TRACKING: Enhanced deleteConversation with deletion tracking
  const deleteConversation = async (conversationId) => {
    try {
      console.log('🗑️ Deleting conversation:', conversationId);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/conversations?id=${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // 🆕 CRITICAL: Track this conversation as deleted by user
        addDeletedConversationId(conversationId);

        // Filter out the deleted conversation from UI
        const updatedConversations = conversations.filter(conv => conv._id !== conversationId);
        setConversations(updatedConversations);

        // Check if the deleted conversation was the current one
        if (currentConversation?._id === conversationId) {
          console.log('🔄 Deleted conversation was current, selecting new one...');

          // Clear from localStorage
          localStorage.removeItem('currentConversationId');

          // If there are other conversations, select the first one
          if (updatedConversations.length > 0) {
            const newCurrent = updatedConversations[0];
            setCurrentConversation(newCurrent);
            localStorage.setItem('currentConversationId', newCurrent._id);

            // Find latest regulation in new current conversation
            if (newCurrent.messages && newCurrent.messages.length > 0) {
              const latestRegulationMessage = newCurrent.messages
                .slice().reverse()
                .find(msg => msg.regulation && msg.regulation.answer);

              setCurrentRegulationResult(latestRegulationMessage?.regulation || null);
            } else {
              setCurrentRegulationResult(null);
            }
          } else {
            // If no more conversations, clear current
            setCurrentConversation(null);
            setCurrentRegulationResult(null);
          }
        }

        console.log('✅ Conversation deleted and tracked as user-deleted:', {
          deletedId: conversationId,
          remainingConversations: updatedConversations.length
        });
      } else {
        throw new Error('Failed to delete conversation');
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
            console.log('✅ Regeneration completed:', regenerationData);

            // FIXED REGENERATION CODE - Apply the requested fixes
            if (regenerationData && regenerationData.conversation && regenerationData.regulation) {
              console.log('✅ Regeneration completed:', {
                conversation: !!regenerationData.conversation,
                regulation: !!regenerationData.regulation
              });

              // CRITICAL FIX 1: Preserve the conversation title from the first user message
              // Don't let the backend override it
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
                    timestamp: new Date().toISOString(), // ✅ Keep the timestamp fix
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
                title: preservedTitle // ✅ Ensure title stays as user's query
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

              // CRITICAL FIX: Save the regenerated assistant message to database to get proper ID
              if (finalConversation && finalConversation.messages.length > 0) {
                const latestMessage = finalConversation.messages[finalConversation.messages.length - 1];
                
                if (latestMessage.role === 'assistant' && !latestMessage._id) {
                  console.log('💾 Saving regenerated message to database...');
                  
                  try {
                    const saveResponse = await fetch('/api/messages/add', {
                      method: 'POST',
                      headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' 
                      },
                      body: JSON.stringify({
                        conversationId: finalConversation._id,
                        role: 'assistant',
                        content: latestMessage.content,
                        regulation: {
                          ...latestMessage.regulation,
                          query_type: latestMessage.regulation.query_type || 'building_codes'  // ✅ Ensure query_type is preserved
                        }
                      })
                    });
                    console.log('💾 Saving with preserved query_type:', latestMessage.regulation.query_type);
                    
                    if (saveResponse.ok) {
                      const savedData = await saveResponse.json();
                      console.log('✅ Regenerated message saved with ID:', savedData.conversation?.messages?.slice(-1)[0]?._id);
                      
                      // Update the conversation with the message that now has an ID
                      if (savedData.conversation) {
                        setCurrentConversation(savedData.conversation);
                        setConversations(prevConversations =>
                          prevConversations.map(conv =>
                            conv._id === savedData.conversation._id ? savedData.conversation : conv
                          )
                        );
                      }
                    }
                  } catch (error) {
                    console.log('⚠️ Failed to save regenerated message to database:', error);
                    // Continue anyway - the message will still work, just without database ID
                  }
                }
              }

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

  // Show loading while checking authentication or loading conversations
  if (loading || isLoadingConversations) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>{loading ? 'Loading...' : 'Loading conversations...'}</p>
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