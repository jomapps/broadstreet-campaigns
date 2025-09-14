import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Network from '@/lib/models/network';

export async function GET() {
  try {
    await connectDB();
    const networks = await Network.find({}).sort({ name: 1 }).lean();
    
    // Shape to include explicit ID naming while keeping existing fields
    const shaped = (networks as any[]).map((n) => ({
      ...n,
      broadstreet_network_id: (n as any).broadstreet_id,
      local_network_id: (n as any)._id?.toString?.(),
    }));
    
    return NextResponse.json({ networks: shaped });
  } catch (error) {
    console.error('Error fetching networks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch networks' },
      { status: 500 }
    );
  }
}
