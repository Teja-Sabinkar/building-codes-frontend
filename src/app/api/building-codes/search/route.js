// src/app/api/building-codes/search/route.js - Direct Regulation Search (No Conversation Storage)
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth';

// Configuration for Python RAG backend
const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || 'http://localhost:8000';

export async function GET(request) {
  try {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const maxResults = parseInt(searchParams.get('maxResults')) || 10;
    const buildingType = searchParams.get('buildingType');
    const codeType = searchParams.get('codeType');
    const jurisdiction = searchParams.get('jurisdiction');

    console.log('🔍 Direct building codes search request:', {
      query,
      maxResults,
      buildingType,
      codeType,
      jurisdiction,
      userId: currentUser.id
    });

    // Validate query
    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Search query (q) parameter is required' },
        { status: 400 }
      );
    }

    if (maxResults > 50) {
      return NextResponse.json(
        { error: 'Maximum results cannot exceed 50' },
        { status: 400 }
      );
    }

    // Build search request for RAG backend
    const searchRequest = {
      question: query.trim(),
      max_results: maxResults,
      search_only: true, // Direct search flag
      filters: {}
    };

    // Add filters if provided
    if (buildingType) {
      searchRequest.filters.building_type = buildingType;
    }
    if (codeType) {
      searchRequest.filters.code_type = codeType;
    }
    if (jurisdiction) {
      searchRequest.filters.jurisdiction = jurisdiction;
    }

    console.log('📡 Calling RAG backend for direct search:', {
      endpoint: `${RAG_BACKEND_URL}/api/search`,
      queryLength: query.length,
      hasFilters: Object.keys(searchRequest.filters).length > 0
    });

    // Call Python RAG backend search endpoint
    const ragStartTime = Date.now();
    let ragResponse;
    
    try {
      const ragRequest = await fetch(`${RAG_BACKEND_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchRequest),
        timeout: 15000 // 15 second timeout for search
      });

      if (!ragRequest.ok) {
        const errorText = await ragRequest.text();
        console.error('❌ RAG search backend error:', ragRequest.status, errorText);
        throw new Error(`RAG search backend error: ${ragRequest.status} - ${errorText}`);
      }

      ragResponse = await ragRequest.json();

    } catch (ragError) {
      console.error('❌ RAG search backend call failed:', ragError);
      
      return NextResponse.json({
        error: 'Building codes search service is temporarily unavailable',
        details: ragError.message
      }, { status: 503 });
    }

    const ragEndTime = Date.now();
    const searchTime = (ragEndTime - ragStartTime) / 1000;

    // Process search results
    const searchResults = {
      query: query.trim(),
      totalResults: ragResponse.total_results || ragResponse.results?.length || 0,
      searchTime: searchTime,
      results: (ragResponse.results || []).map((result, index) => ({
        id: index + 1,
        document: result.document || 'Unknown Document',
        section: result.section || 'Unknown Section',
        page: result.page || 'Unknown Page',
        title: result.title || result.section || 'Untitled',
        excerpt: result.excerpt || result.content || '',
        relevanceScore: result.relevance_score || result.score || 0,
        confidence: result.confidence || 0,
        url: result.url || null,
        lastUpdated: result.last_updated || null
      })),
      filters: {
        buildingType: buildingType || null,
        codeType: codeType || null,
        jurisdiction: jurisdiction || null
      },
      suggestions: ragResponse.suggestions || [],
      relatedTerms: ragResponse.related_terms || []
    };

    console.log('✅ Direct building codes search completed:', {
      query: searchResults.query,
      totalResults: searchResults.totalResults,
      searchTime: searchTime.toFixed(2) + 's',
      hasFilters: Object.values(searchResults.filters).some(f => f !== null)
    });

    return NextResponse.json(searchResults);

  } catch (error) {
    console.error('❌ Building codes search API error:', error);

    return NextResponse.json(
      { error: 'An error occurred while searching building codes' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { query, maxResults = 10, filters = {}, searchType = 'semantic' } = body;

    console.log('🔍 Advanced building codes search request:', {
      query,
      maxResults,
      filters,
      searchType,
      userId: currentUser.id
    });

    // Validate request
    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    if (maxResults > 100) {
      return NextResponse.json(
        { error: 'Maximum results cannot exceed 100' },
        { status: 400 }
      );
    }

    if (!['semantic', 'keyword', 'hybrid'].includes(searchType)) {
      return NextResponse.json(
        { error: 'Search type must be semantic, keyword, or hybrid' },
        { status: 400 }
      );
    }

    // Build advanced search request
    const searchRequest = {
      question: query.trim(),
      max_results: maxResults,
      search_type: searchType,
      filters: filters,
      advanced_search: true
    };

    console.log('📡 Calling RAG backend for advanced search');

    // Call Python RAG backend
    const ragStartTime = Date.now();
    let ragResponse;
    
    try {
      const ragRequest = await fetch(`${RAG_BACKEND_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchRequest),
        timeout: 20000 // 20 second timeout for advanced search
      });

      if (!ragRequest.ok) {
        const errorText = await ragRequest.text();
        console.error('❌ RAG advanced search backend error:', ragRequest.status, errorText);
        throw new Error(`RAG advanced search backend error: ${ragRequest.status}`);
      }

      ragResponse = await ragRequest.json();

    } catch (ragError) {
      console.error('❌ RAG advanced search backend call failed:', ragError);
      
      return NextResponse.json({
        error: 'Advanced building codes search service is temporarily unavailable',
        details: ragError.message
      }, { status: 503 });
    }

    const ragEndTime = Date.now();
    const searchTime = (ragEndTime - ragStartTime) / 1000;

    // Process advanced search results
    const searchResults = {
      query: query.trim(),
      searchType,
      totalResults: ragResponse.total_results || ragResponse.results?.length || 0,
      searchTime: searchTime,
      results: (ragResponse.results || []).map((result, index) => ({
        id: index + 1,
        document: result.document || 'Unknown Document',
        section: result.section || 'Unknown Section',
        page: result.page || 'Unknown Page',
        title: result.title || result.section || 'Untitled',
        excerpt: result.excerpt || result.content || '',
        fullContent: result.full_content || null,
        relevanceScore: result.relevance_score || result.score || 0,
        confidence: result.confidence || 0,
        matchType: result.match_type || searchType,
        highlights: result.highlights || [],
        url: result.url || null,
        metadata: result.metadata || {}
      })),
      appliedFilters: filters,
      aggregations: ragResponse.aggregations || {},
      suggestions: ragResponse.suggestions || [],
      relatedQueries: ragResponse.related_queries || [],
      facets: ragResponse.facets || {}
    };

    console.log('✅ Advanced building codes search completed:', {
      query: searchResults.query,
      searchType: searchResults.searchType,
      totalResults: searchResults.totalResults,
      searchTime: searchTime.toFixed(2) + 's'
    });

    return NextResponse.json(searchResults);

  } catch (error) {
    console.error('❌ Advanced building codes search API error:', error);

    return NextResponse.json(
      { error: 'An error occurred while performing advanced building codes search' },
      { status: 500 }
    );
  }
}