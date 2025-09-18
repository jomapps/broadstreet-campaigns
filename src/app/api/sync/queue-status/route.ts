import { NextResponse } from 'next/server';
import { broadstreetRateLimiter } from '@/lib/rate-limiter';

export async function GET() {
  try {
    const status = broadstreetRateLimiter.getQueueStatus();
    
    return NextResponse.json({
      success: true,
      status: {
        ...status,
        nextRequestIn: status.canMakeRequest ? 0 : Math.max(0, 5000 - status.timeSinceLastRequest),
        rateLimitInfo: {
          requestsPerSecond: 0.2,
          intervalBetweenRequests: 5000,
          maxConcurrentRequests: 1
        }
      }
    });
  } catch (error) {
    console.error('Queue status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ success: false, message: 'Method Not Allowed' }, { status: 405 });
}
