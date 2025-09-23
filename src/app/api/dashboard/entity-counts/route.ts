import { NextRequest, NextResponse } from 'next/server';
import { getEntityCounts } from '@/lib/server/data-fetchers';

/**
 * GET /api/dashboard/entity-counts
 * Returns fresh entity counts for dashboard display
 */
export async function GET(request: NextRequest) {
  try {
    // Parse network ID from URL parameters, default to 9396 for consistency with dashboard page
    const { searchParams } = new URL(request.url);
    const networkParam = searchParams.get('network');
    const networkId = networkParam ? parseInt(networkParam) : 9396;

    const entityCounts = await getEntityCounts(networkId);

    return NextResponse.json(entityCounts);
  } catch (error) {
    console.error('[entity-counts API] Error fetching entity counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entity counts' },
      { status: 500 }
    );
  }
}
