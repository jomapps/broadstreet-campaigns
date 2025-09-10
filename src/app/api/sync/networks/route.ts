import { NextResponse } from 'next/server';
import { syncNetworks } from '@/lib/utils/sync-helpers';

export async function POST() {
  try {
    const result = await syncNetworks();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${result.count} networks`,
        count: result.count,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to sync networks',
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Sync networks error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to sync networks',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
