import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Network from '@/lib/models/network';

export async function GET() {
  try {
    await connectDB();
    const networks = await Network.find({}).sort({ name: 1 }).lean();
    
    return NextResponse.json({
      success: true,
      networks,
    });
  } catch (error) {
    console.error('Get networks error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch networks',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
