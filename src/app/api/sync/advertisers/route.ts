import { NextResponse } from 'next/server';
import { syncAdvertisers } from '@/lib/utils/sync-helpers';

export async function POST() {
  try {
    const result = await syncAdvertisers();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${result.count} advertisers`,
        count: result.count,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to sync advertisers',
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Sync advertisers error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to sync advertisers',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
