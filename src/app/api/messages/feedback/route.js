// src/app/api/messages/feedback/route.js - User Feedback with Detailed Feedback Support
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

export async function POST(request) {
  try {
    console.log('👍 User feedback API called');

    // Get the current user from JWT token
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
      console.log('❌ User not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', currentUser.id);

    // Connect to the database
    await connectToDatabase();

    // Parse the request body
    const { conversationId, messageId, vote, issueType, details } = await request.json();

    console.log('🔍 Feedback request:', {
      conversationId,
      messageId,
      vote,
      hasIssueType: !!issueType,
      hasDetails: !!details,
      userId: currentUser.id
    });

    // Validate required fields
    if (!conversationId || !messageId) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Conversation ID and message ID are required' },
        { status: 400 }
      );
    }

    // Validate vote value
    if (!vote || !['helpful', 'unhelpful'].includes(vote)) {
      console.log('❌ Invalid vote value:', vote);
      return NextResponse.json(
        { error: 'Vote must be either "helpful" or "unhelpful"' },
        { status: 400 }
      );
    }

    // Validate issueType if provided (must match schema enum)
    const validIssueTypes = [
      'UI bug',
      'Did not fully follow my request',
      'Not factually correct',
      'Incomplete response',
      'Report content',
      'Other'
    ];
    
    if (issueType && !validIssueTypes.includes(issueType)) {
      console.log('❌ Invalid issue type:', issueType);
      return NextResponse.json(
        { error: 'Invalid issue type provided' },
        { status: 400 }
      );
    }

    // Validate details length if provided
    if (details && details.length > 2000) {
      console.log('❌ Details too long:', details.length);
      return NextResponse.json(
        { error: 'Feedback details cannot exceed 2000 characters' },
        { status: 400 }
      );
    }

    // Find the conversation
    console.log('🔍 Finding conversation...');
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: currentUser.id
    });

    if (!conversation) {
      console.log('❌ Conversation not found:', { conversationId, userId: currentUser.id });
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    console.log('✅ Conversation found:', {
      title: conversation.title,
      messageCount: conversation.messages.length
    });

    // Find the message by _id
    const message = conversation.messages.id(messageId);

    if (!message) {
      console.log('❌ Message not found:', messageId);
      return NextResponse.json(
        { error: 'Message not found in conversation' },
        { status: 404 }
      );
    }

    console.log('✅ Message found:', {
      role: message.role,
      hasRegulation: !!message.regulation,
      currentFeedback: message.feedback
    });

    // Only allow feedback on assistant messages
    if (message.role !== 'assistant') {
      console.log('❌ Cannot add feedback to non-assistant message:', message.role);
      return NextResponse.json(
        { error: 'Feedback can only be added to assistant responses' },
        { status: 400 }
      );
    }

    // Check if user is changing their vote
    const previousVote = message.feedback?.userVote;
    const isChangingVote = previousVote && previousVote !== vote;

    // Update the feedback
    if (!message.feedback) {
      message.feedback = {};
    }

    message.feedback.userVote = vote;
    message.feedback.votedAt = new Date();
    
    // 🆕 Save detailed feedback if provided
    if (issueType) {
      message.feedback.issueType = issueType;
      console.log('📝 Issue type saved:', issueType);
    }
    
    if (details && details.trim()) {
      message.feedback.details = details.trim();
      console.log('📝 Feedback details saved (length):', details.trim().length);
    }

    // Mark the messages array as modified
    conversation.markModified('messages');

    // Save the conversation
    await conversation.save();

    console.log('✅ Feedback saved successfully:', {
      messageId,
      vote,
      issueType: message.feedback.issueType || 'none',
      hasDetails: !!message.feedback.details,
      detailsLength: message.feedback.details?.length || 0,
      previousVote,
      isChangingVote,
      votedAt: message.feedback.votedAt
    });

    return NextResponse.json({
      message: 'Feedback saved successfully',
      feedback: {
        userVote: message.feedback.userVote,
        issueType: message.feedback.issueType,
        hasDetails: !!message.feedback.details,
        votedAt: message.feedback.votedAt,
        isChangingVote
      }
    });

  } catch (error) {
    console.error('❌ User feedback API error:', error);

    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid conversation or message ID format' },
        { status: 400 }
      );
    }

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'An error occurred while saving feedback',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve feedback for a specific message
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

    await connectToDatabase();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const messageId = searchParams.get('messageId');

    if (!conversationId || !messageId) {
      return NextResponse.json(
        { error: 'Conversation ID and message ID are required' },
        { status: 400 }
      );
    }

    // Find the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: currentUser.id
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Find the message
    const message = conversation.messages.id(messageId);

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found in conversation' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      feedback: message.feedback || { 
        userVote: null, 
        votedAt: null,
        issueType: null,
        details: null
      }
    });

  } catch (error) {
    console.error('❌ Get feedback error:', error);

    return NextResponse.json(
      { error: 'An error occurred while fetching feedback' },
      { status: 500 }
    );
  }
}