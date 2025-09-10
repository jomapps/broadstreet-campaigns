import { NextResponse } from 'next/server';
import { syncCampaigns } from '@/lib/utils/sync-helpers';

export async function POST() {
  try {
    const result = await syncCampaigns();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${result.count} campaigns`,
        count: result.count,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to sync campaigns',
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Sync campaigns error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to sync campaigns',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
