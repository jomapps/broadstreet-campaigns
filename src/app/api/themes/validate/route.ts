import { NextRequest, NextResponse } from 'next/server';
import { themeValidationService } from '@/lib/theme-validation-service';

/**
 * POST /api/themes/validate
 * Start theme validation process
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] Starting theme validation...');
    
    const result = await themeValidationService.startValidation();
    
    return NextResponse.json({
      success: true,
      message: 'Theme validation completed',
      result
    });

  } catch (error) {
    console.error('[API] Theme validation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

/**
 * GET /api/themes/validate
 * Get current validation status
 */
export async function GET(request: NextRequest) {
  try {
    const status = themeValidationService.getStatus();
    
    return NextResponse.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('[API] Failed to get validation status:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
