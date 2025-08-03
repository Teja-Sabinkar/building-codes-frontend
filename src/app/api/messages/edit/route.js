// src/app/api/messages/edit/route.js - Building Codes Assistant
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import Conversation from '@/models/Conversation';

// Helper function to get authenticated user (JWT-based)
async function getAuthenticatedUser() {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null;
    }

    const token = authorization.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await connectToDatabase();
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId);

    return user ? { id: user._id, email: user.email, name: user.name } : null;
  } catch (error) {
    return null;
  }
}

export async function PATCH(request) {
  try {
    console.log('🔧 Regulation message edit API called');

    // Change from cookie-based to JWT-based authentication
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
      console.log('❌ User not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', currentUser.id);

    await connectToDatabase();
    console.log('✅ Database connected');

    const body = await request.json();
    const { conversationId, messageIndex, newContent, shouldRegenerate = true } = body;

    console.log('📝 Regulation query edit request:', {
      conversationId,
      messageIndex,
      shouldRegenerate,
      contentLength: newContent?.length,
      hasNewContent: !!newContent
    });

    // Validate required fields
    if (!conversationId) {
      console.log('❌ Missing conversationId');
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    if (messageIndex === undefined || messageIndex === null) {
      console.log('❌ Missing messageIndex');
      return NextResponse.json(
        { error: 'Message index is required' },
        { status: 400 }
      );
    }

    if (!newContent || typeof newContent !== 'string' || !newContent.trim()) {
      console.log('❌ Invalid newContent:', { newContent, type: typeof newContent });
      return NextResponse.json(
        { error: 'New content is required and must be a non-empty regulation question' },
        { status: 400 }
      );
    }

    // Find conversation
    console.log('🔍 Finding regulation conversation...');
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: currentUser.id
    });

    if (!conversation) {
      console.log('❌ Regulation conversation not found:', { conversationId, userId: currentUser.id });
      return NextResponse.json(
        { error: 'Regulation conversation not found' },
        { status: 404 }
      );
    }

    console.log('✅ Regulation conversation found:', {
      messageCount: conversation.messages.length,
      targetIndex: messageIndex,
      title: conversation.title,
      hasEditMethod: typeof conversation.editMessageAndRegenerate === 'function'
    });

    // Validate message index
    if (messageIndex < 0 || messageIndex >= conversation.messages.length) {
      console.log('❌ Invalid message index:', {
        messageIndex,
        messageCount: conversation.messages.length
      });
      return NextResponse.json(
        { error: `Invalid message index: ${messageIndex}. Valid range: 0-${conversation.messages.length - 1}` },
        { status: 400 }
      );
    }

    const message = conversation.messages[messageIndex];
    console.log('📨 Target message:', {
      role: message.role,
      contentLength: message.content?.length,
      isEdited: message.isEdited,
      hasRegulationData: !!(message.regulation)
    });

    // Only allow editing user messages (regulation questions)
    if (message.role !== 'user') {
      console.log('❌ Cannot edit non-user message:', { role: message.role });
      return NextResponse.json(
        { error: 'Only user regulation questions can be edited' },
        { status: 400 }
      );
    }

    const originalMessageCount = conversation.messages.length;

    // Perform the edit operation
    console.log('✏️ Starting regulation query edit operation...');

    if (shouldRegenerate) {
      console.log('🔄 Will regenerate regulation answer after edit');

      try {
        // Store original content if first edit
        if (!message.isEdited) {
          message.originalContent = message.content;
          message.isEdited = true;
        }

        // Update message content
        message.content = newContent.trim();
        message.editedAt = new Date();

        // 🔧 FIX: Update timestamp to current time for edited messages
        message.timestamp = new Date();  // ← ADD THIS LINE

        // Remove all messages after the edited message (regulation answers need regeneration)
        conversation.messages = conversation.messages.slice(0, messageIndex + 1);

        console.log('✂️ Messages truncated for regulation regeneration:', {
          originalCount: originalMessageCount,
          newCount: conversation.messages.length,
          removedCount: originalMessageCount - conversation.messages.length
        });

        // Mark as modified and save
        conversation.markModified('messages');
        await conversation.save();

        console.log('✅ Regulation query edit operation completed');

      } catch (error) {
        console.error('❌ Error in regulation query edit operation:', error);
        throw new Error(`Failed to edit regulation query: ${error.message}`);
      }

    } else {
      console.log('📝 Edit regulation query only, no regeneration');

      try {
        // If content is being updated, track the edit
        if (newContent.trim() !== message.content) {
          if (!message.isEdited) {
            message.originalContent = message.content;
            message.isEdited = true;
          }
          message.editedAt = new Date();
        }

        message.content = newContent.trim();
        conversation.markModified('messages');
        await conversation.save();

        console.log('✅ Regulation query update operation completed');

      } catch (error) {
        console.error('❌ Error in regulation query update operation:', error);
        throw new Error(`Failed to update regulation query: ${error.message}`);
      }
    }

    console.log('✅ Regulation query edit operation completed successfully');

    // Reload conversation to get updated data
    console.log('🔄 Reloading regulation conversation...');
    const updatedConversation = await Conversation.findById(conversation._id);

    if (!updatedConversation) {
      console.log('❌ Failed to reload regulation conversation');
      throw new Error('Failed to reload regulation conversation after edit');
    }

    // Count remaining regulation queries after edit
    const remainingRegulationQueries = updatedConversation.messages.filter(msg =>
      msg.regulation && msg.regulation.answer
    ).length;

    console.log('✅ Regulation query edit completed successfully:', {
      originalMessageCount,
      newMessageCount: updatedConversation.messages.length,
      messagesRemoved: originalMessageCount - updatedConversation.messages.length,
      remainingRegulationQueries,
      shouldRegenerate,
      lastMessageRole: updatedConversation.messages[updatedConversation.messages.length - 1]?.role,
      editedQuestion: newContent.substring(0, 100) + '...'
    });

    return NextResponse.json({
      message: 'Regulation query edited successfully',
      conversation: updatedConversation,
      shouldRegenerate: shouldRegenerate,
      editedMessageIndex: messageIndex,
      regulationStats: {
        remainingQueries: remainingRegulationQueries,
        messagesRemoved: originalMessageCount - updatedConversation.messages.length
      }
    });

  } catch (error) {
    console.error('❌ Edit regulation query API error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Return more specific error message for regulation context
    const errorMessage = error.message || 'An error occurred while editing the regulation query';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Change from cookie-based to JWT-based authentication
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const messageIndex = parseInt(searchParams.get('messageIndex'));

    if (!conversationId || messageIndex === undefined) {
      return NextResponse.json(
        { error: 'Conversation ID and message index are required' },
        { status: 400 }
      );
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: currentUser.id
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Regulation conversation not found' },
        { status: 404 }
      );
    }

    if (messageIndex < 0 || messageIndex >= conversation.messages.length) {
      return NextResponse.json(
        { error: 'Invalid message index' },
        { status: 400 }
      );
    }

    const message = conversation.messages[messageIndex];

    // Enhanced response for regulation context
    const response = {
      message: {
        id: message._id,
        content: message.content,
        originalContent: message.originalContent,
        isEdited: message.isEdited,
        editedAt: message.editedAt,
        timestamp: message.timestamp,
        role: message.role
      }
    };

    // If this is a regulation query (user message), add query context
    if (message.role === 'user') {
      // Check if there's a corresponding regulation answer
      const nextMessage = conversation.messages[messageIndex + 1];
      if (nextMessage && nextMessage.role === 'assistant' && nextMessage.regulation) {
        response.regulationAnswer = {
          confidence: nextMessage.regulation.confidence,
          buildingType: nextMessage.regulation.queryMetadata?.buildingType,
          codeType: nextMessage.regulation.queryMetadata?.codeType,
          referencesCount: nextMessage.regulation.references?.length || 0
        };
      }
    }

    console.log('📖 Retrieved regulation message edit history:', {
      messageIndex,
      role: message.role,
      isEdited: message.isEdited,
      hasRegulationAnswer: !!response.regulationAnswer
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get regulation message edit history error:', error);

    return NextResponse.json(
      { error: 'An error occurred while fetching regulation message edit history' },
      { status: 500 }
    );
  }
}