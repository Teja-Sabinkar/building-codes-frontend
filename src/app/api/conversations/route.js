// src/app/api/conversations/route.js - Building Codes Assistant
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

export async function GET(request) {
  try {
    // Get the current user from JWT token
    const currentUser = await getAuthenticatedUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = parseInt(searchParams.get('skip')) || 0;  
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Build query
    const query = { userId: currentUser.id };
    if (!includeArchived) {
      query['metadata.isArchived'] = { $ne: true };        
    }

    // Find regulation conversations for the user
    const conversations = await Conversation.find(query)   
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean(); // Use lean() for better performance        

    // Get total count for pagination
    const totalCount = await Conversation.countDocuments(query);

    // Add regulation-specific statistics to each conversation
    const conversationsWithStats = conversations.map(conversation => {
      // Count regulation queries in this conversation     
      const regulationCount = conversation.messages ?      
        conversation.messages.filter(msg => msg.regulation && msg.regulation.answer).length : 0;
      
      // Calculate average confidence for this conversation
      const regulationMessages = conversation.messages ?   
        conversation.messages.filter(msg => msg.regulation && msg.regulation.confidence !== null) : [];

      const averageConfidence = regulationMessages.length > 0 ?
        regulationMessages.reduce((sum, msg) => sum + msg.regulation.confidence, 0) / regulationMessages.length : null;

      // Find most recent regulation query
      const lastRegulationMessage = conversation.messages ?
        conversation.messages.slice().reverse().find(msg => msg.regulation && msg.regulation.answer) : null;

      return {
        ...conversation,
        // Add regulation-specific virtual properties      
        regulationCount,
        averageConfidence,
        lastRegulationQuery: lastRegulationMessage?.timestamp || null,
        lastRegulationTopic: lastRegulationMessage?.regulation?.queryMetadata?.buildingType || null,
        lastCodeType: lastRegulationMessage?.regulation?.queryMetadata?.codeType || null
      };
    });

    // Return conversations with pagination info and regulation statistics
    return NextResponse.json({
      conversations: conversationsWithStats,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + conversations.length < totalCount  
      },
      summary: {
        totalConversations: totalCount,
        totalRegulationQueries: conversationsWithStats.reduce((sum, conv) => sum + conv.regulationCount, 0),
        averageQueriesPerConversation: totalCount > 0 ?    
          conversationsWithStats.reduce((sum, conv) => sum + conv.regulationCount, 0) / totalCount : 0
      }
    });

  } catch (error) {
    console.error('Get regulation conversations error:', error);

    return NextResponse.json(
      { error: 'An error occurred while fetching regulation conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Get the current user from JWT token
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Parse the request body
    const { title, initialMessage } = await request.json();

    // Create a new regulation conversation
    const conversation = await Conversation.createNew(     
      currentUser.id,
      title || 'New Regulation Query'
    );

    console.log('✅ Created new regulation conversation:', {
      id: conversation._id,
      title: conversation.title,
      userId: currentUser.id
    });

    // If there's an initial message, add it
    if (initialMessage && initialMessage.trim()) {
      await conversation.addMessage({
        role: 'user',
        content: initialMessage.trim(),
        timestamp: new Date()
      });

      console.log('✅ Added initial message to conversation');
    }

    // Return the created conversation
    return NextResponse.json({
      message: 'Regulation conversation created successfully',
      conversation
    }, { status: 201 });

  } catch (error) {
    console.error('Create regulation conversation error:', error);

    return NextResponse.json(
      { error: 'An error occurred while creating the regulation conversation' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    // Get the current user from JWT token
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Parse the request body
    const { conversationId, updates } = await request.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Find and update the conversation
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

    console.log('🔄 Updating regulation conversation:', {
      conversationId,
      updates: Object.keys(updates),
      currentTitle: conversation.title
    });

    // Apply allowed updates for regulation conversations  
    const allowedUpdates = ['title', 'metadata'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'metadata') {
          // Merge metadata instead of replacing (preserve regulation-specific metadata)
          conversation.metadata = {
            ...conversation.metadata,
            ...updates.metadata
          };
        } else if (key === 'title') {
          // Validate title for regulation context
          const newTitle = updates.title.trim();
          if (newTitle.length > 0 && newTitle.length <= 100) {
            conversation.title = newTitle;
          }
        } else {
          conversation[key] = updates[key];
        }
      }
    });

    await conversation.save();

    console.log('✅ Regulation conversation updated:', {  
      newTitle: conversation.title,
      messageCount: conversation.messages.length
    });

    return NextResponse.json({
      message: 'Regulation conversation updated successfully',
      conversation
    });

  } catch (error) {
    console.error('Update regulation conversation error:', error);

    return NextResponse.json(
      { error: 'An error occurred while updating the regulation conversation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // Get the current user from JWT token
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Find the regulation conversation
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

    // Count regulation queries in this conversation for logging
    const regulationCount = conversation.messages.filter(msg =>
      msg.regulation && msg.regulation.answer
    ).length;

    console.log('🗑️ Deleting regulation conversation:', {
      conversationId,
      title: conversation.title,
      messageCount: conversation.messages.length,
      regulationCount,
      permanent
    });

    if (permanent) {
      // Permanently delete the conversation (admin only or special cases)
      await Conversation.findByIdAndDelete(conversationId);

      console.log('💀 Permanently deleted regulation conversation');

      return NextResponse.json({
        message: 'Regulation conversation permanently deleted'
      });
    } else {
      // Soft delete: Archive the conversation instead of deleting
      // This removes it from user's view but keeps regulation data for analytics
      await conversation.archive();

      console.log('📦 Archived regulation conversation');

      return NextResponse.json({
        message: 'Regulation conversation deleted successfully',
        conversation,
        note: 'Conversation has been archived and can be recovered by an administrator'
      });
    }

  } catch (error) {
    console.error('Delete regulation conversation error:', error);

    return NextResponse.json(
      { error: 'An error occurred while deleting the regulation conversation' },
      { status: 500 }
    );
  }
}