// src/app/api/user/recently-viewed/route.js
// Recently Viewed PDFs API - Handles GET and POST for tracking PDF viewing history
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';

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

    return user;
  } catch (error) {
    console.error('❌ Auth error in recently-viewed API:', error);
    return null;
  }
}

/**
 * GET /api/user/recently-viewed
 * Retrieve recently viewed PDFs for a specific region
 * Query params: region (India|Scotland|Dubai), userId (optional, uses JWT if not provided)
 */
export async function GET(request) {
  try {
    console.log('\n📚 ========== GET RECENTLY VIEWED PDFs ==========');

    // Get authenticated user
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
      console.log('❌ User not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', currentUser._id);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');

    // Validate region parameter
    if (!region) {
      console.log('❌ Missing region parameter');
      return NextResponse.json(
        { error: 'Region parameter is required (India, Scotland, or Dubai)' },
        { status: 400 }
      );
    }

    const validRegions = ['India', 'Scotland', 'Dubai'];
    if (!validRegions.includes(region)) {
      console.log('❌ Invalid region:', region);
      return NextResponse.json(
        { error: `Invalid region: ${region}. Must be one of: ${validRegions.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('📍 Fetching recently viewed PDFs for region:', region);

    // Get recently viewed PDFs using User model method
    const recentPdfs = currentUser.getRecentlyViewedPdfs(region);

    console.log('✅ Retrieved recently viewed PDFs:', {
      region,
      count: recentPdfs.length,
      user: currentUser._id
    });

    // Return the PDFs
    return NextResponse.json({
      success: true,
      region,
      pdfs: recentPdfs,
      count: recentPdfs.length
    }, { status: 200 });

  } catch (error) {
    console.error('❌ GET recently-viewed error:', error);

    return NextResponse.json(
      { 
        error: 'An error occurred while fetching recently viewed PDFs',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/recently-viewed
 * Add or update a recently viewed PDF
 * Body: { documentName, displayName, pdfFilename, page, country }
 */
export async function POST(request) {
  try {
    console.log('\n📝 ========== ADD/UPDATE RECENTLY VIEWED PDF ==========');

    // Get authenticated user
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
      console.log('❌ User not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', currentUser._id);

    // Parse request body
    const body = await request.json();
    const { documentName, displayName, pdfFilename, page, country } = body;

    console.log('📄 Adding recently viewed PDF:', {
      documentName,
      displayName,
      page,
      country,
      user: currentUser._id
    });

    // Validate required fields
    if (!documentName || !displayName || !pdfFilename || !page || !country) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['documentName', 'displayName', 'pdfFilename', 'page', 'country']
        },
        { status: 400 }
      );
    }

    // Validate region
    const validRegions = ['India', 'Scotland', 'Dubai'];
    if (!validRegions.includes(country)) {
      console.log('❌ Invalid country:', country);
      return NextResponse.json(
        { error: `Invalid country: ${country}. Must be one of: ${validRegions.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate page number
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      console.log('❌ Invalid page number:', page);
      return NextResponse.json(
        { error: 'Page must be a positive number' },
        { status: 400 }
      );
    }

    // Add or update recently viewed PDF using User model method
    await currentUser.addRecentlyViewedPdf({
      documentName,
      displayName,
      pdfFilename,
      page: pageNum,
      country
    });

    console.log('✅ Successfully added/updated recently viewed PDF');

    // Get updated list to return
    const updatedPdfs = currentUser.getRecentlyViewedPdfs(country);

    return NextResponse.json({
      success: true,
      message: 'PDF viewing history updated successfully',
      region: country,
      count: updatedPdfs.length,
      pdfs: updatedPdfs
    }, { status: 200 });

  } catch (error) {
    console.error('❌ POST recently-viewed error:', error);

    // Enhanced error handling
    if (error.message && error.message.includes('Invalid region')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'An error occurred while updating PDF viewing history',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/recently-viewed
 * Clear recently viewed PDFs for a specific region
 * Query params: region (India|Scotland|Dubai)
 */
export async function DELETE(request) {
  try {
    console.log('\n🗑️ ========== CLEAR RECENTLY VIEWED PDFs ==========');

    // Get authenticated user
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
      console.log('❌ User not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', currentUser._id);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');

    // Validate region parameter
    if (!region) {
      console.log('❌ Missing region parameter');
      return NextResponse.json(
        { error: 'Region parameter is required (India, Scotland, or Dubai)' },
        { status: 400 }
      );
    }

    const validRegions = ['India', 'Scotland', 'Dubai'];
    if (!validRegions.includes(region)) {
      console.log('❌ Invalid region:', region);
      return NextResponse.json(
        { error: `Invalid region: ${region}. Must be one of: ${validRegions.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('🗑️ Clearing recently viewed PDFs for region:', region);

    // Clear recently viewed PDFs using User model method
    await currentUser.clearRecentlyViewedPdfs(region);

    console.log('✅ Successfully cleared recently viewed PDFs');

    return NextResponse.json({
      success: true,
      message: `Recently viewed PDFs cleared for ${region}`,
      region,
      count: 0
    }, { status: 200 });

  } catch (error) {
    console.error('❌ DELETE recently-viewed error:', error);

    return NextResponse.json(
      { 
        error: 'An error occurred while clearing PDF viewing history',
        details: error.message 
      },
      { status: 500 }
    );
  }
}