// src/app/api/health/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Test database connection
    await connectToDatabase();
    
    const responseTime = Date.now() - startTime;
    
    // Return healthy status
    return NextResponse.json({
      status: 'healthy',
      uptime: true,
      service: 'REG-GPT API',
      timestamp: new Date().toISOString(),
      responseTime: responseTime,
      database: 'connected',
      version: '1.0.0'
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    // Return unhealthy status
    return NextResponse.json({
      status: 'unhealthy',
      uptime: false,
      service: 'REG-GPT API',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: 'disconnected'
    }, { 
      status: 503 // Service Unavailable
    });
  }
}

// Optional: Support HEAD requests (faster, UptimeRobot can use these)
export async function HEAD() {
  try {
    await connectToDatabase();
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}