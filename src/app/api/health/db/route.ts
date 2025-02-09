import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db/mongodb';

export async function GET() {
  try {
    const health = await checkDatabaseHealth();
    
    if (health.status === 'healthy') {
      return NextResponse.json(health, { status: 200 });
    } else {
      return NextResponse.json(health, { status: 503 });
    }
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      latency: -1,
      message: `Failed to check database health: ${error.message}`
    }, { status: 500 });
  }
}

// Add OPTIONS method for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}