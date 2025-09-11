import { NextRequest, NextResponse } from 'next/server';
import syncService from '@/lib/sync-service';
import { clearAllZoneSelections } from '@/lib/utils/zone-selection-helpers';

export async function POST(request: NextRequest) {
  try {
    const { networkId } = await request.json();

    if (!networkId) {
      return NextResponse.json(
        { error: 'Network ID is required' },
        { status: 400 }
      );
    }

    // Clear zone selections before syncing
    clearAllZoneSelections();

    const results = await syncService.syncZones(networkId);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: failed === 0,
      results,
      summary: {
        total: results.length,
        successful,
        failed
      }
    });

  } catch (error) {
    console.error('Zone sync error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}