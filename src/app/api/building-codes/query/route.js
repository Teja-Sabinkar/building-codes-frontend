// src/app/api/building-codes/query/route.js - Building Codes Assistant Main Query API
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Conversation from '@/models/Conversation';
import { getCurrentUser } from '@/lib/auth/auth';

// Configuration for Python RAG backend
const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || 'http://localhost:8000';

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

    const { question, conversationId, maxResults = 5, isRegeneration = false } = await request.json();

    console.log('🏗️ Building Codes Query API Request:', {
      hasQuestion: !!question,
      conversationId,
      isRegeneration,
      maxResults,
      userId: currentUser.id
    });

    // Validate request
    if (!isRegeneration && (!question || !question.trim())) {
      return NextResponse.json(
        { error: 'Question is required for new queries' },
        { status: 400 }
      );
    }

    let conversation;

    // Find or create conversation
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: currentUser.id
      });

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    } else {
      // Create new conversation for new query
      conversation = await Conversation.createNew(currentUser.id, 'New Regulation Query');
      console.log('✅ Created new conversation:', conversation._id);
    }

    // Add user message for new queries (not regenerations)
    if (!isRegeneration && question && question.trim()) {
      await conversation.addMessage({
        role: 'user',
        content: question.trim(),
        timestamp: new Date()
      });
      console.log('✅ Added user message to conversation');
    }

    // Prepare query for RAG system
    let queryText = question?.trim();
    
    // For regenerations, use the last user message
    if (isRegeneration && conversation.messages.length > 0) {
      const lastUserMessage = conversation.messages
        .slice().reverse()
        .find(msg => msg.role === 'user');
      
      if (lastUserMessage) {
        queryText = lastUserMessage.content;
        console.log('🔄 Using last user message for regeneration:', queryText.substring(0, 100) + '...');
      } else {
        return NextResponse.json(
          { error: 'No user message found for regeneration' },
          { status: 400 }
        );
      }
    }

    if (!queryText) {
      return NextResponse.json(
        { error: 'No query text available' },
        { status: 400 }
      );
    }

    console.log('🔍 Querying RAG backend:', {
      queryLength: queryText.length,
      maxResults,
      backendUrl: RAG_BACKEND_URL
    });

    // Call Python RAG backend
    const ragStartTime = Date.now();
    let ragResponse;
    
    try {
      const ragRequest = await fetch(`${RAG_BACKEND_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: queryText,
          max_results: maxResults,
          conversation_id: conversation._id.toString()
        }),
        timeout: 30000 // 30 second timeout
      });

      if (!ragRequest.ok) {
        const errorText = await ragRequest.text();
        console.error('❌ RAG backend error:', ragRequest.status, errorText);
        throw new Error(`RAG backend error: ${ragRequest.status} - ${errorText}`);
      }

      ragResponse = await ragRequest.json();
      console.log('✅ RAG backend response received:', {
        hasAnswer: !!ragResponse.answer,
        confidence: ragResponse.confidence,
        referencesCount: ragResponse.references?.length || 0,
        processingTime: ragResponse.processing_time
      });

    } catch (ragError) {
      console.error('❌ RAG backend call failed:', ragError);
      
      // Return user-friendly error message
      return NextResponse.json({
        error: 'Building regulations search service is temporarily unavailable. Please try again.',
        details: ragError.message,
        conversation: conversation
      }, { status: 503 });
    }

    const ragEndTime = Date.now();
    const totalProcessingTime = (ragEndTime - ragStartTime) / 1000;

    // Validate RAG response
    if (!ragResponse.answer) {
      console.error('❌ RAG backend returned no answer');
      return NextResponse.json({
        error: 'No answer found for your building regulation query. Please try rephrasing your question.',
        conversation: conversation
      }, { status: 404 });
    }

    // Process and enhance the RAG response
    const regulationData = {
      answer: ragResponse.answer,
      confidence: ragResponse.confidence || 0.5,
      processingTime: ragResponse.processing_time || totalProcessingTime,
      references: (ragResponse.references || []).map((ref, index) => ({
        id: index + 1,
        document: ref.document || 'Unknown Document',
        section: ref.section || 'Unknown Section',
        page: ref.page || 'Unknown Page',
        confidence: ref.confidence || 0.5,
        relevanceScore: ref.relevance_score || ref.confidence || 0.5
      })),
      relatedRegulations: ragResponse.related_regulations || [],
      queryMetadata: {
        searchTerms: extractSearchTerms(queryText),
        buildingType: detectBuildingType(queryText),
        codeType: detectCodeType(queryText),
        jurisdiction: ragResponse.jurisdiction || 'General',
        lastUpdated: new Date()
      }
    };

    console.log('📊 Processed regulation data:', {
      answerLength: regulationData.answer.length,
      confidence: regulationData.confidence,
      referencesCount: regulationData.references.length,
      buildingType: regulationData.queryMetadata.buildingType,
      codeType: regulationData.queryMetadata.codeType
    });

    // Create assistant response message
    const assistantMessage = {
      role: 'assistant',
      content: ragResponse.answer,
      timestamp: new Date(),
      regulation: regulationData
    };

    // Add assistant message to conversation
    await conversation.addMessage(assistantMessage);
    console.log('✅ Added assistant message with regulation data');

    // Reload conversation to get updated data with virtuals
    const updatedConversation = await Conversation.findById(conversation._id);

    console.log('✅ Building codes query completed:', {
      conversationId: updatedConversation._id,
      finalMessageCount: updatedConversation.messages.length,
      latestRegulationConfidence: regulationData.confidence,
      totalProcessingTime: totalProcessingTime.toFixed(2) + 's'
    });

    return NextResponse.json({
      message: 'Building regulation query completed successfully',
      conversation: updatedConversation,
      regulation: regulationData,
      isRegeneration,
      performance: {
        ragBackendTime: ragResponse.processing_time || 0,
        totalTime: totalProcessingTime,
        referencesFound: regulationData.references.length
      }
    });

  } catch (error) {
    console.error('❌ Building Codes Query API error:', error);

    // Handle specific error types
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      return NextResponse.json(
        { error: 'Database error occurred. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while processing your building regulation query' },
      { status: 500 }
    );
  }
}

// Health check endpoint for RAG backend connectivity
export async function GET(request) {
  try {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('🔧 Building Codes API health check requested');

    // Test RAG backend connectivity
    try {
      const healthResponse = await fetch(`${RAG_BACKEND_URL}/api/health`, {
        method: 'GET',
        timeout: 5000
      });

      const ragHealth = await healthResponse.json();

      return NextResponse.json({
        status: 'healthy',
        ragBackend: {
          url: RAG_BACKEND_URL,
          status: healthResponse.ok ? 'connected' : 'error',
          modelLoaded: ragHealth.model_loaded || false,
          responseTime: ragHealth.response_time || null
        },
        timestamp: new Date().toISOString()
      });

    } catch (ragError) {
      console.error('❌ RAG backend health check failed:', ragError);

      return NextResponse.json({
        status: 'degraded',
        ragBackend: {
          url: RAG_BACKEND_URL,
          status: 'disconnected',
          error: ragError.message
        },
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

  } catch (error) {
    console.error('❌ Health check error:', error);

    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper function to extract search terms from query
function extractSearchTerms(queryText) {
  const commonWords = ['what', 'are', 'the', 'for', 'in', 'of', 'and', 'or', 'is', 'requirements', 'minimum', 'maximum', 'how', 'when', 'where', 'why'];
  
  return queryText
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .slice(0, 10); // Limit to 10 terms
}

// Helper function to detect building type from query
function detectBuildingType(queryText) {
  const buildingTypes = {
    'residential': ['residential', 'house', 'home', 'dwelling', 'apartment', 'condo', 'townhouse'],
    'commercial': ['commercial', 'office', 'retail', 'store', 'business', 'shop'],
    'institutional': ['school', 'hospital', 'church', 'institutional', 'library', 'courthouse'],
    'industrial': ['industrial', 'factory', 'warehouse', 'manufacturing', 'plant'],
    'mixed-use': ['mixed', 'multi-use', 'mixed-use']
  };

  const queryLower = queryText.toLowerCase();
  
  for (const [type, keywords] of Object.entries(buildingTypes)) {
    if (keywords.some(keyword => queryLower.includes(keyword))) {
      return type;
    }
  }
  
  return 'general';
}

// Helper function to detect code type from query  
function detectCodeType(queryText) {
  const codeTypes = {
    'IBC': ['ibc', 'international building code', 'building code'],
    'IRC': ['irc', 'residential code', 'international residential'],
    'ADA': ['ada', 'accessibility', 'americans with disabilities', 'disabled'],
    'NFPA': ['nfpa', 'fire', 'fire safety', 'sprinkler', 'fire protection'],
    'IECC': ['energy', 'iecc', 'efficiency', 'insulation', 'energy code'],
    'IPC': ['plumbing', 'ipc', 'water', 'sewer', 'plumbing code'],
    'IMC': ['mechanical', 'imc', 'hvac', 'ventilation', 'mechanical code'],
    'NEC': ['electrical', 'nec', 'wiring', 'circuit', 'electrical code']
  };

  const queryLower = queryText.toLowerCase();
  
  for (const [type, keywords] of Object.entries(codeTypes)) {
    if (keywords.some(keyword => queryLower.includes(keyword))) {
      return type;
    }
  }
  
  return 'general';
}