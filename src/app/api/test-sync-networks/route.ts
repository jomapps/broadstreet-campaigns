import { NextResponse } from 'next/server';
import { syncNetworks } from '@/lib/utils/sync-helpers';

export async function GET() {
  try {
    console.log('Testing networks sync...');
    
    const result = await syncNetworks();
    
    console.log('Networks sync result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Networks sync test completed',
      result
    });
  } catch (error) {
    console.error('Networks sync test error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Networks sync test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
