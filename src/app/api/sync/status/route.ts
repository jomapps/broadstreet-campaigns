import { NextRequest, NextResponse } from 'next/server';
import { themeValidationService } from '@/lib/theme-validation-service';
import type { SyncStatus } from '@/lib/types/api';

/**
 * GET /api/sync/status
 * Get current sync and validation status for the header
 */
export async function GET(request: NextRequest) {
  try {
    const validationStatus = themeValidationService.getStatus();
    
    let syncStatus: SyncStatus;

    // Determine overall status based on validation state
    switch (validationStatus.status) {
      case 'running':
        syncStatus = {
          status: 'validating',
          message: 'API Syncing',
          details: {
            validationInProgress: true,
            validationStatus
          },
          timestamp: new Date().toISOString()
        };
        break;

      case 'error':
        syncStatus = {
          status: 'error',
          message: 'API Error',
          details: {
            error: validationStatus.error,
            validationStatus
          },
          timestamp: new Date().toISOString()
        };
        break;

      case 'completed':
      case 'idle':
      default:
        syncStatus = {
          status: 'connected',
          message: 'API Connected',
          details: {
            validationInProgress: false,
            validationStatus
          },
          timestamp: new Date().toISOString()
        };
        break;
    }

    return NextResponse.json({
      success: true,
      status: syncStatus
    });

  } catch (error) {
    console.error('[API] Failed to get sync status:', error);
    
    const errorStatus: SyncStatus = {
      status: 'error',
      message: 'API Error',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: false,
      status: errorStatus
    }, { status: 500 });
  }
}
