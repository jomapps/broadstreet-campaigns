import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Network from '@/lib/models/network';

export async function GET() {
  try {
    await connectDB();
    const networks = await Network.find({}).sort({ name: 1 }).lean();
    
    return NextResponse.json({ networks });
  } catch (error) {
    console.error('Error fetching networks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch networks' },
      { status: 500 }
    );
  }
}
