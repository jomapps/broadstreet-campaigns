import { NextRequest, NextResponse } from 'next/server';
import syncService from '@/lib/sync-service';
import LocalZone from '@/lib/models/local-zone';
import LocalAdvertiser from '@/lib/models/local-advertiser';
import LocalCampaign from '@/lib/models/local-campaign';
import LocalNetwork from '@/lib/models/local-network';
import LocalAdvertisement from '@/lib/models/local-advertisement';
import Placement from '@/lib/models/placement';
import { clearAllZoneSelections } from '@/lib/utils/zone-selection-helpers';
import { syncAll } from '@/lib/utils/sync-helpers';
import connectDB from '@/lib/mongodb';

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
    // Perform full sync
    let syncReport = await syncService.syncAllEntities(networkId);

    // Run fallback syncs if needed
    const fallbackResults: any[] = [];
    if (unsyncedCampCount > 0) {
      console.warn('[local-all] Running campaign-only sync fallback');
      const campResults = await syncService.syncCampaigns(networkId);
      fallbackResults.push(...campResults);
    }

    if (fallbackResults.length > 0) {
      const successful = fallbackResults.filter(r => r.success).length;
      const failed = fallbackResults.length - successful;
      syncReport = {
        ...syncReport,
        totalEntities: syncReport.totalEntities + fallbackResults.length,
        successfulSyncs: syncReport.successfulSyncs + successful,
        failedSyncs: syncReport.failedSyncs + failed,
        results: [...syncReport.results, ...fallbackResults],
        success: failed === 0 && syncReport.failedSyncs === 0,
      };
    }
    console.log('[local-all] Sync report summary:', {
      success: syncReport.success,
      totalEntities: syncReport.totalEntities,
      successfulSyncs: syncReport.successfulSyncs,
      failedSyncs: syncReport.failedSyncs,
    });

    // NEW WORKFLOW: If sync was successful, delete all local-only entities and trigger dashboard sync
    if (syncReport.success) {
      console.log('[local-all] Sync successful, starting cleanup and dashboard sync...');

      try {
        // Step 1: Delete all local-only entities
        console.log('[local-all] Deleting all local-only entities...');
        await connectDB();

        // First, clear embedded placements from synced campaigns (but keep the campaigns)
        const embeddedPlacementsClearResult = await LocalCampaign.updateMany(
          { synced_with_api: true, 'placements.0': { $exists: true } },
          { $unset: { placements: 1 } }
        );
        console.log(`[local-all] Cleared embedded placements from ${embeddedPlacementsClearResult.modifiedCount} synced campaigns`);

        const deleteResults = await Promise.allSettled([
          LocalAdvertiser.deleteMany({ synced_with_api: false }),
          LocalCampaign.deleteMany({ synced_with_api: false }),
          LocalZone.deleteMany({ synced_with_api: false }),
          LocalAdvertisement.deleteMany({ synced_with_api: false }),
          LocalNetwork.deleteMany({ synced_with_api: false }),
          Placement.deleteMany({ created_locally: true, synced_with_api: false }),
        ]);

        let totalDeleted = 0;
        const deleteErrors: string[] = [];
        const entityTypes = ['advertisers', 'campaigns', 'zones', 'advertisements', 'networks', 'placements'];

        deleteResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const deletedCount = result.value.deletedCount || 0;
            totalDeleted += deletedCount;
            console.log(`[local-all] Deleted ${deletedCount} local ${entityTypes[index]}`);
          } else {
            const error = `Failed to delete local ${entityTypes[index]}: ${result.reason}`;
            deleteErrors.push(error);
            console.error(`[local-all] ${error}`);
          }
        });

        // Add the cleared embedded placements to the total count
        totalDeleted += embeddedPlacementsClearResult.modifiedCount;

        console.log(`[local-all] Cleanup completed: ${totalDeleted} entities deleted (including ${embeddedPlacementsClearResult.modifiedCount} embedded placements), ${deleteErrors.length} errors`);

        // Step 2: Trigger dashboard sync to refresh all data from Broadstreet
        console.log('[local-all] Starting dashboard sync...');
        const dashboardSyncResult = await syncAll();

        console.log('[local-all] Dashboard sync completed:', {
          success: dashboardSyncResult.success,
          error: dashboardSyncResult.error
        });

        // Return comprehensive response
        const responsePayload = {
          success: syncReport.success && dashboardSyncResult.success,
          report: syncReport,
          dryRun,
          cleanup: {
            success: deleteErrors.length === 0,
            totalDeleted,
            errors: deleteErrors
          },
          dashboardSync: {
            success: dashboardSyncResult.success,
            results: dashboardSyncResult.results,
            error: dashboardSyncResult.error
          }
        };

        console.log('[local-all] Final response payload:', {
          success: responsePayload.success,
          report: {
            totalEntities: responsePayload.report.totalEntities,
            successfulSyncs: responsePayload.report.successfulSyncs,
            failedSyncs: responsePayload.report.failedSyncs,
          },
          cleanup: {
            success: responsePayload.cleanup.success,
            totalDeleted: responsePayload.cleanup.totalDeleted,
            errorCount: responsePayload.cleanup.errors.length
          },
          dashboardSync: {
            success: responsePayload.dashboardSync.success,
            error: responsePayload.dashboardSync.error
          }
        });

        return NextResponse.json(responsePayload);

      } catch (cleanupError) {
        console.error('[local-all] Cleanup/dashboard sync failed:', cleanupError);

        // Return partial success - sync worked but cleanup failed
        const responsePayload = {
          success: false, // Overall failure due to cleanup issues
          report: syncReport,
          dryRun,
          cleanup: {
            success: false,
            totalDeleted: 0,
            errors: [cleanupError instanceof Error ? cleanupError.message : 'Unknown cleanup error']
          },
          dashboardSync: {
            success: false,
            error: 'Cleanup failed, dashboard sync not attempted'
          }
        };

        return NextResponse.json(responsePayload);
      }
    } else {
      // Original behavior for failed syncs
      const responsePayload = {
        success: syncReport.success,
        report: syncReport,
        dryRun
      };
      console.log('[local-all] Sync failed, skipping cleanup. Response payload:', {
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
    }

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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}