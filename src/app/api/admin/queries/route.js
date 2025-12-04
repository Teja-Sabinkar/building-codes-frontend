// src/app/api/admin/queries/route.js - Admin Query Log API
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

export async function GET(request) {
  try {
    console.log('📋 Admin queries log API called');

    // Authenticate user
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
      console.log('❌ User not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', currentUser.email);

    // TODO: Add admin role check
    // For now, any authenticated user can access query logs
    // In production, add: if (!currentUser.isAdmin) { return 403; }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const regionFilter = searchParams.get('region') || 'all';
    const feedbackFilter = searchParams.get('feedback') || 'all';
    const responseTimeFilter = searchParams.get('responseTime') || 'all';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('🔍 Query parameters:', {
      searchTerm,
      regionFilter,
      feedbackFilter,
      responseTimeFilter,
      dateFrom,
      dateTo,
      page,
      limit
    });

    // Connect to database
    await connectToDatabase();

    // Build query
    const query = {
      'metadata.isArchived': { $ne: true }
    };

    // Region filter
    if (regionFilter !== 'all') {
      query.region = regionFilter;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.updatedAt = {};
      if (dateFrom) {
        query.updatedAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.updatedAt.$lte = endDate;
      }
    }

    console.log('🔎 MongoDB query:', JSON.stringify(query, null, 2));

    // Get conversations matching filters
    const conversations = await Conversation.find(query)
      .populate('userId', 'email name')
      .sort({ updatedAt: -1 })
      .lean();

    console.log(`📊 Found ${conversations.length} conversations`);

    // Extract all queries from conversations
    const allQueries = [];

    for (const conv of conversations) {
      const messages = conv.messages || [];
      
      // Process user messages and their corresponding assistant responses
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        
        // Only process user messages (queries)
        if (message.role !== 'user') continue;

        // Find the corresponding assistant response
        const assistantResponse = messages.find((m, idx) => 
          idx > i && m.role === 'assistant' && m.regulation
        );

        if (!assistantResponse || !assistantResponse.regulation) continue;

        const regulation = assistantResponse.regulation;

        // Determine feedback based on confidence score
        // confidence >= 0.7 = helpful, < 0.7 = unhelpful
        const feedback = regulation.confidence >= 0.7 ? 'helpful' : 'unhelpful';

        // Response time from regulation data
        const responseTime = regulation.processingTime || 0;

        // Apply filters
        // Search term filter
        if (searchTerm && !message.content.toLowerCase().includes(searchTerm.toLowerCase())) {
          continue;
        }

        // Feedback filter
        if (feedbackFilter !== 'all' && feedback !== feedbackFilter) {
          continue;
        }

        // Response time filter
        if (responseTimeFilter !== 'all') {
          if (responseTimeFilter === 'fast' && responseTime >= 2) continue;
          if (responseTimeFilter === 'medium' && (responseTime < 2 || responseTime >= 5)) continue;
          if (responseTimeFilter === 'slow' && responseTime < 5) continue;
        }

        // Build query object
        allQueries.push({
          id: `${conv._id}_${message._id}`,
          conversationId: conv._id,
          messageId: message._id,
          query: message.content,
          userEmail: conv.userId?.email || 'Unknown',
          userName: conv.userId?.name || 'Unknown',
          region: conv.region || 'India',
          timestamp: message.timestamp || conv.updatedAt,
          responseTime: parseFloat(responseTime.toFixed(2)),
          feedback,
          confidence: regulation.confidence,
          buildingType: regulation.queryMetadata?.buildingType || null,
          codeType: regulation.queryMetadata?.codeType || null
        });
      }
    }

    console.log(`📋 Extracted ${allQueries.length} queries from conversations`);

    // Sort by timestamp (newest first)
    allQueries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedQueries = allQueries.slice(startIndex, endIndex);

    console.log(`📄 Returning ${paginatedQueries.length} queries for page ${page}`);

    // Build response
    const response = {
      queries: paginatedQueries,
      pagination: {
        total: allQueries.length,
        page,
        limit,
        totalPages: Math.ceil(allQueries.length / limit),
        hasMore: endIndex < allQueries.length
      },
      filters: {
        searchTerm,
        regionFilter,
        feedbackFilter,
        responseTimeFilter,
        dateFrom,
        dateTo
      }
    };

    console.log('✅ Query log fetched successfully:', {
      totalQueries: allQueries.length,
      returnedQueries: paginatedQueries.length,
      page,
      totalPages: response.pagination.totalPages
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Admin queries log API error:', error);

    return NextResponse.json(
      { 
        error: 'An error occurred while fetching query log',
        details: error.message 
      },
      { status: 500 }
    );
  }
}