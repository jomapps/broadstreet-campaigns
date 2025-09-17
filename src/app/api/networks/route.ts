import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Network from '@/lib/models/network';
import Advertiser from '@/lib/models/advertiser';
import Zone from '@/lib/models/zone';

export async function GET() {
  try {
    await connectDB();
    const networks = await Network.find({}).sort({ name: 1 }).lean();

    // Compute counts per network using aggregation for accuracy
    const advertiserCounts = await Advertiser.aggregate([
      { $match: { network_id: { $ne: null } } },
      { $group: { _id: '$network_id', count: { $sum: 1 } } },
    ]);
    const zoneCounts = await Zone.aggregate([
      { $match: { network_id: { $ne: null } } },
      { $group: { _id: '$network_id', count: { $sum: 1 } } },
    ]);

    const advertiserCountMap = new Map<number, number>(
      advertiserCounts.map((c: any) => [Number(c._id), Number(c.count)])
    );
    const zoneCountMap = new Map<number, number>(
      zoneCounts.map((c: any) => [Number(c._id), Number(c.count)])
    );
    
    // Shape to include explicit ID naming while keeping existing fields
    const shaped = (networks as any[]).map((n) => {
      const bsId = (n as any).broadstreet_id as number;
      const advertisers = advertiserCountMap.get(bsId) ?? (n as any).advertiser_count ?? 0;
      const zones = zoneCountMap.get(bsId) ?? (n as any).zone_count ?? 0;
      return {
        ...n,
        advertiser_count: advertisers,
        zone_count: zones,
        broadstreet_network_id: (n as any).broadstreet_id,
        local_network_id: (n as any)._id?.toString?.(),
      };
    });
    
    return NextResponse.json({ networks: shaped });
  } catch (error) {
    console.error('Error fetching networks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch networks' },
      { status: 500 }
    );
  }
}
