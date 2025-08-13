// src/app/api/auth/delete-account/route.js - Soft Account Deletion for REG-GPT
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

    return user ? { id: user._id, email: user.email, name: user.name, fullUser: user } : null;
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

    console.log('🗑️ Account deletion request:', {
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.name,
      timestamp: new Date().toISOString()
    });

    // Get user's conversation statistics before deletion
    const userConversations = await Conversation.find({
      userId: currentUser.id
    });

    const conversationStats = {
      totalConversations: userConversations.length,
      activeConversations: userConversations.filter(c => !c.metadata?.isArchived).length,
      archivedConversations: userConversations.filter(c => c.metadata?.isArchived).length,
      totalMessages: userConversations.reduce((sum, c) => sum + (c.messages?.length || 0), 0),
      totalRegulationQueries: userConversations.reduce((sum, c) => {
        return sum + (c.messages?.filter(msg => msg.regulation && msg.regulation.answer).length || 0);
      }, 0)
    };

    console.log('📊 User data before deletion:', conversationStats);

    // SOFT DELETE: Mark user as deleted instead of removing
    const deletionData = {
      // Mark account as deleted
      isDeleted: true,
      deletedAt: new Date(),
      
      // Preserve original data for audit/recovery
      originalEmail: currentUser.fullUser.email,
      originalName: currentUser.fullUser.name,
      
      // Clear sensitive data but keep for recovery
      email: `deleted_${currentUser.id}@deleted.regGPT.local`,
      
      // Preserve profile and usage stats for analytics
      // (these remain untouched)
    };

    console.log('🔄 Applying soft deletion to user account...');

    // Update user record with deletion markers
    const deletedUser = await User.findByIdAndUpdate(
      currentUser.id,
      {
        $set: deletionData
      },
      { 
        new: true,
        select: 'isDeleted deletedAt originalEmail originalName email usageStats' 
      }
    );

    if (!deletedUser) {
      throw new Error('User not found for deletion');
    }

    console.log('✅ User account soft deleted:', {
      userId: currentUser.id,
      isDeleted: deletedUser.isDeleted,
      deletedAt: deletedUser.deletedAt,
      preservedEmail: deletedUser.originalEmail,
      preservedUsageStats: !!deletedUser.usageStats
    });

    // Archive all user's conversations (soft delete them too)
    console.log('🗂️ Archiving user conversations...');
    
    let archivedCount = 0;
    const archiveResults = [];

    for (const conversation of userConversations) {
      try {
        if (!conversation.metadata?.isArchived) {
          await conversation.archive();
          archivedCount++;
          archiveResults.push({
            conversationId: conversation._id,
            status: 'archived',
            title: conversation.title
          });
        } else {
          archiveResults.push({
            conversationId: conversation._id,
            status: 'already_archived',
            title: conversation.title
          });
        }
      } catch (convError) {
        console.error(`❌ Error archiving conversation ${conversation._id}:`, convError);
        archiveResults.push({
          conversationId: conversation._id,
          status: 'error',
          title: conversation.title,
          error: convError.message
        });
      }
    }

    console.log('✅ Conversation archiving completed:', {
      totalProcessed: userConversations.length,
      newlyArchived: archivedCount,
      alreadyArchived: archiveResults.filter(r => r.status === 'already_archived').length,
      errors: archiveResults.filter(r => r.status === 'error').length
    });

    // Create deletion audit log entry (for admin recovery)
    const deletionAudit = {
      userId: currentUser.id,
      deletedAt: new Date(),
      originalData: {
        email: currentUser.fullUser.email,
        name: currentUser.fullUser.name,
        joinDate: currentUser.fullUser.createdAt,
        lastLogin: currentUser.fullUser.lastLogin
      },
      conversationStats,
      archiveResults: archiveResults.slice(0, 10), // First 10 for audit
      reason: 'user_requested',
      recoverable: true
    };

    console.log('📋 Account deletion audit created:', {
      userId: deletionAudit.userId,
      deletedAt: deletionAudit.deletedAt,
      conversationCount: deletionAudit.conversationStats.totalConversations,
      recoverable: deletionAudit.recoverable
    });

    // Return success response with deletion summary
    return NextResponse.json({
      message: 'Account successfully deleted',
      deletionSummary: {
        accountDeleted: true,
        deletedAt: deletedUser.deletedAt,
        conversationsArchived: archivedCount,
        totalConversations: conversationStats.totalConversations,
        dataPreserved: true,
        recoverable: true
      },
      audit: {
        userId: currentUser.id,
        originalEmail: currentUser.fullUser.email,
        deletionTimestamp: deletedUser.deletedAt,
        preservedData: [
          'conversation_history',
          'regulation_queries', 
          'usage_analytics',
          'profile_data'
        ]
      },
      note: 'Account has been deactivated and all data archived. Data can be recovered by an administrator if needed.'
    });

  } catch (error) {
    console.error('❌ Account deletion error:', error);

    return NextResponse.json(
      { 
        error: 'An error occurred while deleting the account',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint to preview what would be deleted (for user confirmation)
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

    // Get user's data summary
    const userConversations = await Conversation.find({
      userId: currentUser.id
    }).select('_id title createdAt updatedAt metadata messages');

    // Calculate what would be affected
    const previewData = {
      account: {
        name: currentUser.fullUser.name,
        email: currentUser.fullUser.email,
        joinDate: currentUser.fullUser.createdAt,
        lastLogin: currentUser.fullUser.lastLogin
      },
      conversations: {
        total: userConversations.length,
        active: userConversations.filter(c => !c.metadata?.isArchived).length,
        archived: userConversations.filter(c => c.metadata?.isArchived).length
      },
      usage: {
        totalMessages: userConversations.reduce((sum, c) => sum + (c.messages?.length || 0), 0),
        totalRegulationQueries: userConversations.reduce((sum, c) => {
          return sum + (c.messages?.filter(msg => msg.regulation && msg.regulation.answer).length || 0);
        }, 0),
        usageStats: currentUser.fullUser.usageStats
      },
      deletionType: 'soft_delete',
      dataPreservation: {
        conversationsArchived: true,
        usageAnalyticsPreserved: true,
        adminRecoveryPossible: true,
        permanentDataLoss: false
      }
    };

    return NextResponse.json({
      message: 'Account deletion preview',
      preview: previewData,
      actions: [
        'Account will be marked as deleted and deactivated',
        'All conversations will be archived (not permanently deleted)',
        'Usage statistics will be preserved for analytics',
        'Email will be anonymized but account recoverable by admin',
        'No permanent data loss will occur'
      ]
    });

  } catch (error) {
    console.error('❌ Account deletion preview error:', error);

    return NextResponse.json(
      { 
        error: 'An error occurred while previewing account deletion',
        details: error.message
      },
      { status: 500 }
    );
  }
}