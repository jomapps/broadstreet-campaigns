import { NextResponse } from 'next/server';
import broadstreetAPI from '@/lib/broadstreet-api';

export async function GET() {
  try {
    console.log('Testing Broadstreet API connection...');
    console.log('API Base URL:', process.env.BROADSTREET_API_BASE_URL);
    console.log('API Token (first 10 chars):', process.env.BROADSTREET_API_TOKEN?.substring(0, 10) + '...');
    
    // Test the networks endpoint
    const networks = await broadstreetAPI.getNetworks();
    
    return NextResponse.json({
      success: true,
      message: 'Broadstreet API connection successful',
      networkCount: networks.length,
      networks: networks.slice(0, 2) // Return first 2 networks for testing
    });
  } catch (error) {
    console.error('Broadstreet API test error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Broadstreet API connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        status: (error as any)?.status,
        statusText: (error as any)?.statusText,
        endpoint: (error as any)?.endpoint,
        responseText: (error as any)?.responseText
      }
    }, { status: 500 });
  }
}
