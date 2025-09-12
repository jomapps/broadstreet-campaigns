import { NextRequest, NextResponse } from 'next/server';
import syncService from '@/lib/sync-service';
import LocalZone from '@/lib/models/local-zone';
import LocalAdvertiser from '@/lib/models/local-advertiser';
import LocalCampaign from '@/lib/models/local-campaign';
import { clearAllZoneSelections } from '@/lib/utils/zone-selection-helpers';

export async function POST(request: NextRequest) {
  try {
    // Require JSON body with networkId; do not accept query fallback
    let networkId: number | undefined;
    const body = await request.json();
    console.log('[local-all] Incoming request body:', body);
    if (body && typeof body.networkId !== 'undefined') {
      networkId = typeof body.networkId === 'string' ? parseInt(body.networkId, 10) : body.networkId;
    }

    if (!networkId) {
      return NextResponse.json(
        { error: 'Network ID is required in JSON body' },
        { status: 400 }
      );
    }

    // Clear zone selections before syncing
    clearAllZoneSelections();

    // Perform dry run first
    const dryRun = await syncService.dryRunSync(networkId);
    console.log('[local-all] Dry run result:', {
      valid: (dryRun as any)?.valid,
      warnings: (dryRun as any)?.warnings?.length || 0,
      errors: (dryRun as any)?.errors?.length || 0,
    });
    
    if (!dryRun.valid) {
      return NextResponse.json({
        success: false,
        error: 'Dry run validation failed',
        details: dryRun
      }, { status: 400 });
    }

    // Audit unsynced counts directly (should match service)
    const [unsyncedAdvCount, unsyncedZoneCount, unsyncedCampCount] = await Promise.all([
      LocalAdvertiser.countDocuments({ network_id: networkId, synced_with_api: false }),
      LocalZone.countDocuments({ network_id: networkId, synced_with_api: false }),
      LocalCampaign.countDocuments({ network_id: networkId, synced_with_api: false }),
    ]);
    console.log('[local-all] Direct unsynced counts:', {
      advertisers: unsyncedAdvCount,
      zones: unsyncedZoneCount,
      campaigns: unsyncedCampCount,
    });

    // Perform full sync
    console.log('[local-all] Starting full sync for networkId:', networkId);
    let syncReport = await syncService.syncAllEntities(networkId);
    console.log('[local-all] Finished full sync');

    // Fallback: if report shows 0 but we detected unsynced zones, run zone-only sync to surface POST logs
    if (syncReport.totalEntities === 0 && unsyncedZoneCount > 0) {
      console.warn('[local-all] Sync report had 0 entities but zones are unsynced; running zone-only sync fallback');
      const zoneResults = await syncService.syncZones(networkId);
      const successful = zoneResults.filter(r => r.success).length;
      const failed = zoneResults.length - successful;
      syncReport = {
        ...syncReport,
        totalEntities: zoneResults.length,
        successfulSyncs: syncReport.successfulSyncs + successful,
        failedSyncs: syncReport.failedSyncs + failed,
        results: [...syncReport.results, ...zoneResults],
        success: failed === 0 && syncReport.failedSyncs === 0,
      };
    }
    console.log('[local-all] Sync report summary:', {
      success: syncReport.success,
      totalEntities: syncReport.totalEntities,
      successfulSyncs: syncReport.successfulSyncs,
      failedSyncs: syncReport.failedSyncs,
    });

    const responsePayload = {
      success: syncReport.success,
      report: syncReport,
      dryRun
    };
    console.log('[local-all] Response payload:', {
      success: responsePayload.success,
      report: {
        totalEntities: responsePayload.report.totalEntities,
        successfulSyncs: responsePayload.report.successfulSyncs,
        failedSyncs: responsePayload.report.failedSyncs,
      },
      dryRun: {
        valid: (responsePayload.dryRun as any)?.valid,
      }
    });
    return NextResponse.json(responsePayload);

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