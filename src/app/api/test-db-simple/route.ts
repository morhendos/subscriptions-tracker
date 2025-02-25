import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Simple test endpoint',
      timestamp: new Date().toISOString(),
      environment: {
        node_env: process.env.NODE_ENV,
        has_mongodb_uri: !!process.env.MONGODB_URI,
        has_nextauth_secret: !!process.env.NEXTAUTH_SECRET,
        has_nextauth_url: !!process.env.NEXTAUTH_URL
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}