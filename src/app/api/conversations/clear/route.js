// src/app/api/conversations/clear/route.js - Clear All Conversations for User
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
    console.error('Authentication error:', error);
    return null;
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

    // Parse query parameters for deletion type
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';
    
    console.log('🗑️ Clear all conversations request:', {
      userId: currentUser.id,
      userEmail: currentUser.email,
      permanent,
      timestamp: new Date().toISOString()
    });

    // Find all conversations for this user
    const conversations = await Conversation.find({
      userId: currentUser.id
    });

    if (conversations.length === 0) {
      return NextResponse.json({
        message: 'No conversations found to clear',
        deletedCount: 0,
        permanent: false
      });
    }

    console.log('📊 Found conversations to clear:', {
      totalCount: conversations.length,
      conversationIds: conversations.map(c => c._id),
      titles: conversations.map(c => c.title).slice(0, 5) // Log first 5 titles
    });

    let deletedCount = 0;
    let operationResults = [];

    if (permanent) {
      // ⚠️ PERMANENT DELETION - Only for admin or special cases
      console.log('💀 PERMANENT deletion requested - this is irreversible!');
      
      const deleteResult = await Conversation.deleteMany({
        userId: currentUser.id
      });
      
      deletedCount = deleteResult.deletedCount;
      
      console.log('💀 Permanently deleted conversations:', {
        deletedCount,
        userId: currentUser.id
      });

      return NextResponse.json({
        message: `Permanently deleted ${deletedCount} conversations`,
        deletedCount,
        permanent: true,
        warning: 'All conversation data has been permanently removed and cannot be recovered'
      });

    } else {
      // 📦 SOFT DELETION - Archive all conversations (recommended)
      console.log('📦 Soft deletion (archive) - conversations can be recovered');
      
      for (const conversation of conversations) {
        try {
          // Check if already archived
          if (conversation.metadata?.isArchived) {
            console.log(`⏭️ Skipping already archived conversation: ${conversation._id}`);
            operationResults.push({
              conversationId: conversation._id,
              status: 'already_archived',
              title: conversation.title
            });
            continue;
          }

          // Archive the conversation using the existing method
          await conversation.archive();
          deletedCount++;
          
          operationResults.push({
            conversationId: conversation._id,
            status: 'archived',
            title: conversation.title,
            messageCount: conversation.messages?.length || 0,
            regulationCount: conversation.messages?.filter(msg => 
              msg.regulation && msg.regulation.answer
            ).length || 0
          });

          console.log(`📦 Archived conversation: ${conversation._id} - "${conversation.title}"`);

        } catch (convError) {
          console.error(`❌ Error archiving conversation ${conversation._id}:`, convError);
          operationResults.push({
            conversationId: conversation._id,
            status: 'error',
            title: conversation.title,
            error: convError.message
          });
        }
      }

      console.log('✅ Bulk archive operation completed:', {
        totalProcessed: conversations.length,
        successfullyArchived: deletedCount,
        errors: operationResults.filter(r => r.status === 'error').length,
        alreadyArchived: operationResults.filter(r => r.status === 'already_archived').length
      });

      return NextResponse.json({
        message: `Successfully cleared ${deletedCount} conversations`,
        deletedCount,
        permanent: false,
        details: {
          totalProcessed: conversations.length,
          successfullyArchived: deletedCount,
          alreadyArchived: operationResults.filter(r => r.status === 'already_archived').length,
          errors: operationResults.filter(r => r.status === 'error').length
        },
        operationResults: operationResults.slice(0, 10), // Return first 10 results for debugging
        note: 'Conversations have been archived and can be recovered by an administrator if needed'
      });
    }

  } catch (error) {
    console.error('❌ Clear conversations error:', error);

    return NextResponse.json(
      { 
        error: 'An error occurred while clearing conversations',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check what would be cleared (preview)
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

    // Find all conversations for this user
    const conversations = await Conversation.find({
      userId: currentUser.id
    }).select('_id title createdAt updatedAt metadata messages');

    // Calculate statistics
    const stats = {
      totalConversations: conversations.length,
      activeConversations: conversations.filter(c => !c.metadata?.isArchived).length,
      archivedConversations: conversations.filter(c => c.metadata?.isArchived).length,
      totalMessages: conversations.reduce((sum, c) => sum + (c.messages?.length || 0), 0),
      totalRegulationQueries: conversations.reduce((sum, c) => {
        return sum + (c.messages?.filter(msg => msg.regulation && msg.regulation.answer).length || 0);
      }, 0),
      oldestConversation: conversations.length > 0 ? 
        conversations.reduce((oldest, c) => c.createdAt < oldest.createdAt ? c : oldest).createdAt : null,
      newestConversation: conversations.length > 0 ? 
        conversations.reduce((newest, c) => c.createdAt > newest.createdAt ? c : newest).createdAt : null
    };

    return NextResponse.json({
      message: 'Preview of conversations that would be cleared',
      statistics: stats,
      conversations: conversations.map(c => ({
        id: c._id,
        title: c.title,
        messageCount: c.messages?.length || 0,
        isArchived: c.metadata?.isArchived || false,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      })).slice(0, 20) // Show first 20 for preview
    });

  } catch (error) {
    console.error('❌ Preview conversations error:', error);

    return NextResponse.json(
      { 
        error: 'An error occurred while previewing conversations',
        details: error.message
      },
      { status: 500 }
    );
  }
}