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

    // Perform dry run first
    const dryRun = await syncService.dryRunSync(networkId);
    
    if (!dryRun.valid) {
      return NextResponse.json({
        success: false,
        error: 'Dry run validation failed',
        details: dryRun
      }, { status: 400 });
    }

    // Perform full sync
    const syncReport = await syncService.syncAllEntities(networkId);

    return NextResponse.json({
      success: syncReport.success,
      report: syncReport,
      dryRun
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const networkId = searchParams.get('networkId');

    if (!networkId) {
      return NextResponse.json(
        { error: 'Network ID is required' },
        { status: 400 }
      );
    }

    // Perform dry run only
    const dryRun = await syncService.dryRunSync(parseInt(networkId));

    return NextResponse.json({
      success: true,
      dryRun
    });

  } catch (error) {
    console.error('Dry run error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}