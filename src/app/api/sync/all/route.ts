import { NextResponse } from 'next/server';
import { syncAll } from '@/lib/utils/sync-helpers';

export async function POST() {
  try {
    const result = await syncAll();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'All data synced successfully',
        results: result.results,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Some sync operations failed',
        results: result.results,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Sync all error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to sync data',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
