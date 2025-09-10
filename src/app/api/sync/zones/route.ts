import { NextResponse } from 'next/server';
import { syncZones } from '@/lib/utils/sync-helpers';

export async function POST() {
  try {
    const result = await syncZones();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${result.count} zones`,
        count: result.count,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to sync zones',
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Sync zones error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to sync zones',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
