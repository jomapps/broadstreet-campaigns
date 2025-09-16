import { NextRequest, NextResponse } from 'next/server';
import { createSSEResponse, progressService } from '@/lib/progress-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const syncLogId = searchParams.get('syncLogId');

  // Check if client accepts Server-Sent Events
  const accept = request.headers.get('accept');
  if (accept && accept.includes('text/event-stream')) {
    // Return SSE stream
    const response = new Response(
      new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          
          const sendEvent = (data: any, event?: string) => {
            const eventData = `event: ${event || 'progress'}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(eventData));
          };

          // Send initial state
          if (syncLogId) {
            const progress = progressService.getProgress(syncLogId);
            if (progress) {
              sendEvent(progress, 'progress');
            }
          } else {
            // Send all active syncs
            const allProgress = progressService.getAllActiveSync();
            sendEvent(allProgress, 'all-progress');
          }

          // Listen for progress updates
          const progressHandler = (progress: any) => {
            if (!syncLogId || progress.syncLogId === syncLogId) {
              sendEvent(progress, 'progress');
            }
          };

          const completeHandler = (data: any) => {
            if (!syncLogId || data.syncLogId === syncLogId) {
              sendEvent(data, 'complete');
            }
          };

          const cancelledHandler = (data: any) => {
            if (!syncLogId || data.syncLogId === syncLogId) {
              sendEvent(data, 'cancelled');
            }
          };

          progressService.on('progress', progressHandler);
          progressService.on('complete', completeHandler);
          progressService.on('cancelled', cancelledHandler);

          // Keep connection alive
          const keepAlive = setInterval(() => {
            controller.enqueue(encoder.encode(': keep-alive\n\n'));
          }, 30000);

          // Clean up on close
          const cleanup = () => {
            progressService.off('progress', progressHandler);
            progressService.off('complete', completeHandler);
            progressService.off('cancelled', cancelledHandler);
            clearInterval(keepAlive);
            controller.close();
          };

          // Note: In a real implementation, you'd need to handle client disconnect
          // This is a simplified version for demonstration
          setTimeout(cleanup, 300000); // Auto-cleanup after 5 minutes
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        }
      }
    );

    return response;
  }

  // Regular JSON response for current progress
  if (syncLogId) {
    const progress = progressService.getProgress(syncLogId);
    if (progress) {
      return NextResponse.json(progress);
    } else {
      return NextResponse.json({ error: 'Sync operation not found' }, { status: 404 });
    }
  }

  // Return all active syncs
  const allProgress = progressService.getAllActiveSync();
  return NextResponse.json(allProgress);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, syncLogId, ...data } = body;

    switch (action) {
      case 'start':
        progressService.startSync(data.syncLogId, data.networkId, data.totalEntities);
        return NextResponse.json({ success: true });

      case 'update':
        progressService.updatePhaseProgress(
          syncLogId,
          data.phase,
          data.processedInPhase,
          data.totalInPhase,
          data.currentEntity,
          data.message
        );
        return NextResponse.json({ success: true });

      case 'updateCounts':
        progressService.updateEntityCounts(
          syncLogId,
          data.processedEntities,
          data.successfulEntities,
          data.failedEntities
        );
        return NextResponse.json({ success: true });

      case 'complete':
        progressService.completeSync(syncLogId, data.success, data.message);
        return NextResponse.json({ success: true });

      case 'cancel':
        progressService.cancelSync(syncLogId, data.reason);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
