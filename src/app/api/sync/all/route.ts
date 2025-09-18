import { NextResponse } from 'next/server';
import { syncAll } from '@/lib/utils/sync-helpers';
import { clearAllZoneSelections } from '@/lib/utils/zone-selection-helpers';
import { themeValidationService } from '@/lib/theme-validation-service';

export async function POST() {
  try {
    // Clear zone selections before syncing
    await Promise.resolve().then(() => clearAllZoneSelections());
    
    const result = await syncAll();

    if (result.success) {
      // Trigger theme validation workflow in background (non-blocking)
      console.log('[sync/all] Sync completed successfully, starting theme validation...');

      // Start theme validation asynchronously - don't await it
      themeValidationService.startValidation().catch(error => {
        console.error('[sync/all] Theme validation failed:', error);
      });

      return NextResponse.json({
        success: true,
        message: 'All data synced successfully',
        results: result.results,
        overallSuccess: result.success,
        themeValidationStarted: true
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Some sync operations failed',
        results: result.results,
        overallSuccess: false,
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

export async function GET() {
  return NextResponse.json({ success: false, message: 'Method Not Allowed' }, { status: 405 });
}
