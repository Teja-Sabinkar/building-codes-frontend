// src/app/api/document/chunks/route.js - Fetch document chunks for viewer
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const document = searchParams.get('document');
    const country = searchParams.get('country');
    const page = searchParams.get('page'); // Optional: specific page only

    console.log('Document chunks request:', { document, country, page });

    if (!document || !country) {
      return NextResponse.json(
        { error: 'Document name and country are required' },
        { status: 400 }
      );
    }

    // Convert document name to filename format
    // Handle different naming patterns:
    // "NBC 2016-VOL.1" -> "NBC_2016-VOL_1_chunks.json"
    // "Building standards technical handbook January 2025 domestic" -> "Building_standards_technical_handbook_January_2025_domestic_chunks.json"
    
    let filename = document.trim();
    
    // Special handling for NBC documents (keep hyphens, convert periods to underscores)
    if (filename.startsWith('NBC')) {
      filename = filename
        .replace(/\s+/g, '_')           // Spaces to underscores
        .replace(/\./g, '_')            // Periods to underscores (VOL.1 -> VOL_1)
        + '_chunks.json';
    } else {
      // Standard handling for other documents (spaces to underscores, keep hyphens)
      filename = filename
        .replace(/\s+/g, '_')           // Spaces to underscores
        .replace(/[^\w\-]/g, '_')       // Special chars to underscores (keeps hyphens)
        + '_chunks.json';
    }

    console.log('Looking for chunk file:', filename);

    // Construct path to chunks file based on country
    // Path structure: building-codes-backend/app/data/regulations_database/{Country}/building_regulations/
    const baseDir = process.env.CHUNKS_BASE_DIR || path.join(process.cwd(), '..', 'building-codes-backend', 'app', 'data', 'regulations_database');
    const chunkFilePath = path.join(baseDir, country, 'building_regulations', filename);

    console.log('Full path:', chunkFilePath);

    // Check if file exists
    if (!fs.existsSync(chunkFilePath)) {
      console.error('Chunk file not found:', chunkFilePath);
      
      // Try alternative paths (in case file is in subdirectory)
      const alternativePaths = [
        path.join(baseDir, country, 'building_regulations', 'Updated_Technical_Handbooks_(January2025)', filename),
        path.join(baseDir, country, 'building_regulations', 'Cladding_Specific_Guidance', filename),
        path.join(baseDir, country, 'building_regulations', 'Single_Building_Assessment_Documents_(2025)', filename),
      ];

      let foundPath = null;
      for (const altPath of alternativePaths) {
        if (fs.existsSync(altPath)) {
          foundPath = altPath;
          console.log('Found in alternative path:', altPath);
          break;
        }
      }

      if (!foundPath) {
        return NextResponse.json(
          { 
            error: 'Document not found',
            details: `Chunk file not found: ${filename}`,
            searchedPaths: [chunkFilePath, ...alternativePaths]
          },
          { status: 404 }
        );
      }

      // Use the found alternative path
      const fileContent = fs.readFileSync(foundPath, 'utf8');
      const chunks = JSON.parse(fileContent);

      console.log('Loaded chunks from alternative path:', {
        totalChunks: chunks.length,
        path: foundPath
      });

      return processAndReturnChunks(chunks, document, country, page);
    }

    // Read the chunk file
    const fileContent = fs.readFileSync(chunkFilePath, 'utf8');
    const chunks = JSON.parse(fileContent);

    console.log('Loaded chunks:', {
      totalChunks: chunks.length,
      firstPage: chunks[0]?.metadata?.page,
      lastPage: chunks[chunks.length - 1]?.metadata?.page
    });

    return processAndReturnChunks(chunks, document, country, page);

  } catch (error) {
    console.error('Error fetching document chunks:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch document chunks',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to process and return chunks
function processAndReturnChunks(chunks, document, country, requestedPage) {
  // If specific page requested, return only that page
  if (requestedPage) {
    const pageChunk = chunks.find(chunk => 
      String(chunk.metadata?.page) === String(requestedPage)
    );

    if (!pageChunk) {
      return NextResponse.json(
        { error: `Page ${requestedPage} not found in document` },
        { status: 404 }
      );
    }

    console.log('Returning single page:', requestedPage);

    return NextResponse.json({
      document,
      country,
      totalPages: chunks.length,
      page: requestedPage,
      content: pageChunk.content,
      metadata: pageChunk.metadata
    });
  }

  // Return all chunks (for full document navigation)
  const formattedChunks = chunks.map(chunk => ({
    page: chunk.metadata?.page || 'Unknown',
    content: chunk.content || '',
    section: chunk.metadata?.section || '',
    extractionMethod: chunk.metadata?.extraction_method || 'unknown'
  }));

  console.log('Returning full document:', {
    totalPages: formattedChunks.length,
    samplePages: formattedChunks.slice(0, 3).map(c => c.page)
  });

  return NextResponse.json({
    document,
    country,
    totalPages: chunks.length,
    chunks: formattedChunks
  });
}