// src/app/api/building-codes/references/route.js - Specific Building Code Reference Lookup
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
    const document = searchParams.get('document');
    const section = searchParams.get('section');
    const page = searchParams.get('page');
    const referenceId = searchParams.get('id');

    console.log('📖 Building code reference lookup request:', {
      document,
      section,
      page,
      referenceId,
      userId: currentUser.id
    });

    // Validate that we have enough information to lookup a reference
    if (!referenceId && !document) {
      return NextResponse.json(
        { error: 'Either reference ID or document name is required' },
        { status: 400 }
      );
    }

    // Build reference lookup request
    const lookupRequest = {
      reference_type: 'specific',
      include_full_text: true,
      include_context: true
    };

    if (referenceId) {
      lookupRequest.reference_id = referenceId;
    } else {
      lookupRequest.document = document;
      if (section) lookupRequest.section = section;
      if (page) lookupRequest.page = page;
    }

    console.log('📡 Calling RAG backend for reference lookup:', {
      endpoint: `${RAG_BACKEND_URL}/api/reference`,
      lookupType: referenceId ? 'by_id' : 'by_document_section'
    });

    // Call Python RAG backend reference endpoint
    const ragStartTime = Date.now();
    let ragResponse;
    
    try {
      const ragRequest = await fetch(`${RAG_BACKEND_URL}/api/reference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lookupRequest),
        timeout: 10000 // 10 second timeout
      });

      if (!ragRequest.ok) {
        if (ragRequest.status === 404) {
          return NextResponse.json(
            { error: 'Building code reference not found' },
            { status: 404 }
          );
        }
        
        const errorText = await ragRequest.text();
        console.error('❌ RAG reference backend error:', ragRequest.status, errorText);
        throw new Error(`RAG reference backend error: ${ragRequest.status}`);
      }

      ragResponse = await ragRequest.json();

    } catch (ragError) {
      console.error('❌ RAG reference backend call failed:', ragError);
      
      return NextResponse.json({
        error: 'Building codes reference service is temporarily unavailable',
        details: ragError.message
      }, { status: 503 });
    }

    const ragEndTime = Date.now();
    const lookupTime = (ragEndTime - ragStartTime) / 1000;

    // Process reference data
    const referenceData = {
      reference: {
        id: ragResponse.reference?.id || referenceId,
        document: ragResponse.reference?.document || document,
        section: ragResponse.reference?.section || section,
        page: ragResponse.reference?.page || page,
        title: ragResponse.reference?.title || 'Untitled',
        fullText: ragResponse.reference?.full_text || '',
        excerpt: ragResponse.reference?.excerpt || '',
        effectiveDate: ragResponse.reference?.effective_date || null,
        lastUpdated: ragResponse.reference?.last_updated || null,
        jurisdiction: ragResponse.reference?.jurisdiction || 'General',
        codeType: ragResponse.reference?.code_type || 'General',
        url: ragResponse.reference?.url || null
      },
      context: {
        previousSection: ragResponse.context?.previous_section || null,
        nextSection: ragResponse.context?.next_section || null,
        parentSection: ragResponse.context?.parent_section || null,
        subSections: ragResponse.context?.sub_sections || [],
        relatedSections: ragResponse.context?.related_sections || []
      },
      metadata: {
        lookupTime: lookupTime,
        source: ragResponse.source || 'Unknown',
        confidence: ragResponse.confidence || 1.0,
        lastVerified: ragResponse.last_verified || null
      }
    };

    console.log('✅ Building code reference lookup completed:', {
      document: referenceData.reference.document,
      section: referenceData.reference.section,
      hasFullText: !!referenceData.reference.fullText,
      lookupTime: lookupTime.toFixed(2) + 's'
    });

    return NextResponse.json(referenceData);

  } catch (error) {
    console.error('❌ Building codes reference API error:', error);

    return NextResponse.json(
      { error: 'An error occurred while looking up the building code reference' },
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
    const { references, includeFullText = false, includeContext = true } = body;

    console.log('📚 Bulk building code references lookup request:', {
      referenceCount: references?.length || 0,
      includeFullText,
      includeContext,
      userId: currentUser.id
    });

    // Validate request
    if (!references || !Array.isArray(references) || references.length === 0) {
      return NextResponse.json(
        { error: 'References array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (references.length > 20) {
      return NextResponse.json(
        { error: 'Cannot lookup more than 20 references at once' },
        { status: 400 }
      );
    }

    // Validate each reference has required fields
    for (const ref of references) {
      if (!ref.document && !ref.id) {
        return NextResponse.json(
          { error: 'Each reference must have either document name or reference ID' },
          { status: 400 }
        );
      }
    }

    // Build bulk lookup request
    const bulkLookupRequest = {
      references: references,
      include_full_text: includeFullText,
      include_context: includeContext,
      bulk_lookup: true
    };

    console.log('📡 Calling RAG backend for bulk reference lookup');

    // Call Python RAG backend
    const ragStartTime = Date.now();
    let ragResponse;
    
    try {
      const ragRequest = await fetch(`${RAG_BACKEND_URL}/api/reference/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkLookupRequest),
        timeout: 30000 // 30 second timeout for bulk lookup
      });

      if (!ragRequest.ok) {
        const errorText = await ragRequest.text();
        console.error('❌ RAG bulk reference backend error:', ragRequest.status, errorText);
        throw new Error(`RAG bulk reference backend error: ${ragRequest.status}`);
      }

      ragResponse = await ragRequest.json();

    } catch (ragError) {
      console.error('❌ RAG bulk reference backend call failed:', ragError);
      
      return NextResponse.json({
        error: 'Bulk building codes reference service is temporarily unavailable',
        details: ragError.message
      }, { status: 503 });
    }

    const ragEndTime = Date.now();
    const lookupTime = (ragEndTime - ragStartTime) / 1000;

    // Process bulk reference results
    const bulkResults = {
      totalRequested: references.length,
      totalFound: ragResponse.results?.length || 0,
      lookupTime: lookupTime,
      results: (ragResponse.results || []).map((result, index) => ({
        requestIndex: index,
        found: !!result.reference,
        reference: result.reference ? {
          id: result.reference.id,
          document: result.reference.document,
          section: result.reference.section,
          page: result.reference.page,
          title: result.reference.title || 'Untitled',
          fullText: includeFullText ? result.reference.full_text : null,
          excerpt: result.reference.excerpt || '',
          effectiveDate: result.reference.effective_date || null,
          jurisdiction: result.reference.jurisdiction || 'General',
          codeType: result.reference.code_type || 'General',
          url: result.reference.url || null
        } : null,
        context: includeContext ? result.context : null,
        error: result.error || null
      })),
      errors: ragResponse.errors || [],
      summary: {
        foundCount: ragResponse.results?.filter(r => r.reference).length || 0,
        notFoundCount: ragResponse.results?.filter(r => !r.reference).length || 0,
        errorCount: ragResponse.errors?.length || 0
      }
    };

    console.log('✅ Bulk building code references lookup completed:', {
      totalRequested: bulkResults.totalRequested,
      totalFound: bulkResults.totalFound,
      lookupTime: lookupTime.toFixed(2) + 's',
      successRate: ((bulkResults.totalFound / bulkResults.totalRequested) * 100).toFixed(1) + '%'
    });

    return NextResponse.json(bulkResults);

  } catch (error) {
    console.error('❌ Bulk building codes reference API error:', error);

    return NextResponse.json(
      { error: 'An error occurred while performing bulk building code reference lookup' },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS support
export async function OPTIONS(request) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Allow': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}