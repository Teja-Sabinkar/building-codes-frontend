// src/app/api/messages/add/route.js - Building Codes Assistant
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Conversation from '@/models/Conversation';
import { getCurrentUser } from '@/lib/auth/auth';

export async function POST(request) {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    const { conversationId, content, role, regulation } = await request.json();
    
    console.log('📝 Adding message to regulation conversation:', {
      conversationId,
      role,
      contentLength: content?.length,
      hasRegulationData: !!regulation
    });
    
    // Enhanced validation for regulation context
    if (!conversationId || !content || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationId, content, and role are required' },
        { status: 400 }
      );
    }
    
    // Validate role
    if (!['user', 'assistant'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either "user" or "assistant"' },
        { status: 400 }
      );
    }
    
    // Validate content for regulation context
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return NextResponse.json(
        { error: role === 'user' ? 'Regulation question cannot be empty' : 'Response content cannot be empty' },
        { status: 400 }
      );
    }
    
    // Additional validation for regulation data
    if (regulation) {
      if (role !== 'assistant') {
        return NextResponse.json(
          { error: 'Regulation data can only be added to assistant messages' },
          { status: 400 }
        );
      }
      
      // Validate regulation structure
      if (!regulation.answer) {
        return NextResponse.json(
          { error: 'Regulation data must include an answer' },
          { status: 400 }
        );
      }
      
      // Set defaults for missing regulation fields
      regulation.confidence = regulation.confidence || 0.5;
      regulation.processingTime = regulation.processingTime || 0;
      regulation.references = regulation.references || [];
      regulation.queryMetadata = regulation.queryMetadata || {};
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
    
    console.log('✅ Found regulation conversation:', {
      title: conversation.title,
      currentMessageCount: conversation.messages.length,
      existingRegulationQueries: conversation.messages.filter(msg => 
        msg.regulation && msg.regulation.answer
      ).length
    });
    
    // Build message object
    const messageData = {
      role,
      content: trimmedContent,
      timestamp: new Date()
    };
    
    // Add regulation data if provided
    if (regulation) {
      messageData.regulation = regulation;
      
      console.log('📊 Adding regulation data:', {
        hasAnswer: !!regulation.answer,
        confidence: regulation.confidence,
        referencesCount: regulation.references?.length || 0,
        buildingType: regulation.queryMetadata?.buildingType,
        codeType: regulation.queryMetadata?.codeType
      });
    }
    
    // Add the message to the conversation
    await conversation.addMessage(messageData);
    
    // Reload conversation to get updated stats
    const updatedConversation = await Conversation.findById(conversation._id);
    
    if (!updatedConversation) {
      throw new Error('Failed to reload conversation after adding message');
    }
    
    // Calculate regulation statistics
    const regulationMessages = updatedConversation.messages.filter(msg => 
      msg.regulation && msg.regulation.answer
    );
    
    const userMessages = updatedConversation.messages.filter(msg => msg.role === 'user');
    
    const stats = {
      totalMessages: updatedConversation.messages.length,
      regulationQueries: regulationMessages.length,
      userQuestions: userMessages.length,
      averageConfidence: regulationMessages.length > 0 ? 
        regulationMessages.reduce((sum, msg) => sum + (msg.regulation.confidence || 0), 0) / regulationMessages.length : null,
      lastQuery: regulationMessages.length > 0 ? 
        regulationMessages[regulationMessages.length - 1].regulation.queryMetadata : null
    };
    
    console.log('✅ Message added to regulation conversation:', {
      newMessageCount: updatedConversation.messages.length,
      role: messageData.role,
      addedRegulationData: !!regulation,
      regulationStats: stats
    });
    
    // Return enhanced response with regulation statistics
    return NextResponse.json({
      message: role === 'user' ? 
        'Regulation question added successfully' : 
        'Regulation answer added successfully',
      conversation: updatedConversation,
      addedMessage: {
        role: messageData.role,
        contentLength: messageData.content.length,
        hasRegulationData: !!regulation,
        timestamp: messageData.timestamp
      },
      regulationStats: stats
    });
    
  } catch (error) {
    console.error('❌ Add message to regulation conversation error:', error);
    
    // Enhanced error handling for regulation context
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Invalid regulation data format', details: error.message },
        { status: 400 }
      );
    }
    
    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid conversation ID format' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'An error occurred while adding the message to the regulation conversation' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve message addition history/stats
export async function GET(request) {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
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
    
    // Analyze conversation for regulation-specific insights
    const messages = conversation.messages || [];
    const regulationMessages = messages.filter(msg => msg.regulation && msg.regulation.answer);
    const userMessages = messages.filter(msg => msg.role === 'user');
    
    // Build regulation conversation analytics
    const analytics = {
      conversationId,
      title: conversation.title,
      totalMessages: messages.length,
      userQuestions: userMessages.length,
      regulationAnswers: regulationMessages.length,
      averageConfidence: regulationMessages.length > 0 ? 
        regulationMessages.reduce((sum, msg) => sum + (msg.regulation.confidence || 0), 0) / regulationMessages.length : null,
      
      // Topic analysis
      topicBreakdown: {},
      codeTypeBreakdown: {},
      
      // Timeline
      firstMessage: messages.length > 0 ? messages[0].timestamp : null,
      lastMessage: messages.length > 0 ? messages[messages.length - 1].timestamp : null,
      lastRegulationQuery: regulationMessages.length > 0 ? 
        regulationMessages[regulationMessages.length - 1].timestamp : null
    };
    
    // Analyze topics and code types
    regulationMessages.forEach(msg => {
      const metadata = msg.regulation.queryMetadata || {};
      
      // Building type breakdown
      if (metadata.buildingType && metadata.buildingType !== 'general') {
        analytics.topicBreakdown[metadata.buildingType] = 
          (analytics.topicBreakdown[metadata.buildingType] || 0) + 1;
      }
      
      // Code type breakdown
      if (metadata.codeType && metadata.codeType !== 'general') {
        analytics.codeTypeBreakdown[metadata.codeType] = 
          (analytics.codeTypeBreakdown[metadata.codeType] || 0) + 1;
      }
    });
    
    console.log('📊 Retrieved regulation conversation analytics:', {
      conversationId,
      totalMessages: analytics.totalMessages,
      regulationAnswers: analytics.regulationAnswers,
      averageConfidence: analytics.averageConfidence?.toFixed(2),
      topTopics: Object.keys(analytics.topicBreakdown).slice(0, 3)
    });
    
    return NextResponse.json({
      analytics,
      recentMessages: messages.slice(-5).map(msg => ({
        role: msg.role,
        timestamp: msg.timestamp,
        hasRegulationData: !!(msg.regulation),
        contentPreview: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '')
      }))
    });
    
  } catch (error) {
    console.error('❌ Get regulation conversation analytics error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred while fetching regulation conversation analytics' },
      { status: 500 }
    );
  }
}