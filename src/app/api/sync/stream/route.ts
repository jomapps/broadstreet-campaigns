import { NextRequest } from 'next/server';
import { syncAll } from '@/lib/utils/sync-helpers';
import { clearAllZoneSelections } from '@/lib/utils/zone-selection-helpers';
import { themeValidationService } from '@/lib/theme-validation-service';

export async function GET(request: NextRequest) {
  // Set up Server-Sent Events response
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (data: any, event: string = 'progress') => {
        const eventData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(eventData));
      };

      const performSync = async () => {
        try {
          // Send initial connection event
          sendEvent({
            phase: 'connecting',
            message: 'Connecting to Broadstreet API...',
            progress: 0
          }, 'status');

          // Clear zone selections before syncing
          await Promise.resolve().then(() => clearAllZoneSelections());
          
          sendEvent({
            phase: 'initializing',
            message: 'Initializing sync process...',
            progress: 5
          }, 'status');

          // Start the sync process with streaming updates
          const result = await syncAllWithStreaming(sendEvent);

          if (result.success) {
            // Trigger theme validation workflow in background (non-blocking)
            console.log('[sync/stream] Sync completed successfully, starting theme validation...');

            sendEvent({
              phase: 'validation',
              message: 'Starting theme validation...',
              progress: 95
            }, 'status');

            // Start theme validation asynchronously - don't await it
            themeValidationService.startValidation().catch(error => {
              console.error('[sync/stream] Theme validation failed:', error);
            });

            sendEvent({
              phase: 'completed',
              message: 'All data synced successfully',
              progress: 100,
              results: result.results,
              overallSuccess: result.success,
              themeValidationStarted: true
            }, 'complete');
          } else {
            sendEvent({
              phase: 'error',
              message: 'Some sync operations failed',
              progress: 100,
              results: result.results,
              overallSuccess: false,
              error: result.error
            }, 'error');
          }
        } catch (error) {
          console.error('Sync stream error:', error);
          sendEvent({
            phase: 'error',
            message: 'Failed to sync data',
            progress: 100,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, 'error');
        } finally {
          controller.close();
        }
      };

      // Start the sync process
      performSync();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Enhanced sync function with streaming progress updates
async function syncAllWithStreaming(sendEvent: (data: any, event?: string) => void) {
  const results: Record<string, any> = {
    cleanup: { success: false, count: 0 },
    networks: { success: false, count: 0 },
    advertisers: { success: false, count: 0 },
    zones: { success: false, count: 0 },
    campaigns: { success: false, count: 0 },
    advertisements: { success: false, count: 0 },
    placements: { success: false, count: 0 },
  };

  const steps = [
    { key: 'cleanup', name: 'Cleanup', weight: 10 },
    { key: 'networks', name: 'Networks', weight: 15 },
    { key: 'advertisers', name: 'Advertisers', weight: 20 },
    { key: 'zones', name: 'Zones', weight: 20 },
    { key: 'campaigns', name: 'Campaigns', weight: 15 },
    { key: 'advertisements', name: 'Advertisements', weight: 10 },
    { key: 'placements', name: 'Placements', weight: 10 },
  ];

  let cumulativeProgress = 0;

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const startProgress = cumulativeProgress;
      const endProgress = cumulativeProgress + step.weight;

      sendEvent({
        phase: step.key,
        message: `Syncing ${step.name}...`,
        progress: startProgress,
        currentStep: i + 1,
        totalSteps: steps.length
      }, 'step-start');

      // Execute the sync step
      let stepResult;
      switch (step.key) {
        case 'cleanup':
          const { cleanupBroadstreetCollections } = await import('@/lib/utils/sync-helpers');
          stepResult = await cleanupBroadstreetCollections();
          break;
        case 'networks':
          const { syncNetworks } = await import('@/lib/utils/sync-helpers');
          stepResult = await syncNetworks();
          break;
        case 'advertisers':
          const { syncAdvertisers } = await import('@/lib/utils/sync-helpers');
          stepResult = await syncAdvertisers();
          break;
        case 'zones':
          const { syncZones } = await import('@/lib/utils/sync-helpers');
          stepResult = await syncZones();
          break;
        case 'campaigns':
          const { syncCampaigns } = await import('@/lib/utils/sync-helpers');
          stepResult = await syncCampaigns();
          break;
        case 'advertisements':
          const { syncAdvertisements } = await import('@/lib/utils/sync-helpers');
          stepResult = await syncAdvertisements();
          break;
        case 'placements':
          const { syncPlacements } = await import('@/lib/utils/sync-helpers');
          stepResult = await syncPlacements();
          break;
        default:
          stepResult = { success: false, count: 0, error: 'Unknown step' };
      }

      results[step.key] = stepResult;
      cumulativeProgress = endProgress;

      sendEvent({
        phase: step.key,
        message: stepResult.success 
          ? `${step.name} synced successfully (${stepResult.count} records)`
          : `${step.name} sync failed: ${stepResult.error}`,
        progress: endProgress,
        currentStep: i + 1,
        totalSteps: steps.length,
        stepResult: stepResult
      }, stepResult.success ? 'step-complete' : 'step-error');

      // If a critical step fails, we might want to continue or stop
      if (!stepResult.success && step.key === 'cleanup') {
        console.error(`[syncAllWithStreaming] ${step.name} failed:`, stepResult.error);
        return { success: false, results, error: stepResult.error };
      }
    }

    const allSuccessful = Object.values(results).every((result: any) => result.success);
    return { success: allSuccessful, results };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, results, error: message };
  }
}

export async function POST() {
  return new Response('Method Not Allowed', { status: 405 });
}
