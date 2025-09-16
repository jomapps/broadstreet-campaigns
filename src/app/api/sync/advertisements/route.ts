import { NextResponse } from 'next/server';
import { syncAdvertisements } from '@/lib/utils/sync-helpers';

export async function POST() {
  try {
    const result = await syncAdvertisements();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${result.count} advertisements`,
        count: result.count,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to sync advertisements',
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to sync advertisements',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
