import { NextResponse } from 'next/server';
import { syncPlacements } from '@/lib/utils/sync-helpers';

export async function POST() {
  try {
    const result = await syncPlacements();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${result.count} placements`,
        count: result.count,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to sync placements',
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Sync placements error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to sync placements',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
