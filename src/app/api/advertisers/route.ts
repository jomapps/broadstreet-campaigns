import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Advertiser from '@/lib/models/advertiser';
import LocalAdvertiser from '@/lib/models/local-advertiser';
import Placement from '@/lib/models/placement';
import Zone from '@/lib/models/zone';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const networkId = searchParams.get('network_id');
    
    if (!networkId) {
      return NextResponse.json({ advertisers: [] });
    }
    
    // Get all advertisers for the selected network from local collections only
    const [syncedAdvertisers, localAdvertisers] = await Promise.all([
      // Get previously synced advertisers stored locally (no live API calls)
      Advertiser.find({ 
        $or: [
          { network_id: parseInt(networkId) },
          { network_id: { $exists: false } },
          { network_id: null }
        ]
      }).sort({ name: 1 }).lean(),
      
      // Get all local advertisers for this network
      // Include local advertisers regardless of sync state; rely on original_broadstreet_id when present
      LocalAdvertiser.find({ 
        network_id: parseInt(networkId)
      }).sort({ name: 1 }).lean()
    ]);
    
    // Shape synced advertisers to expose explicit ID fields
    const shapedSyncedAdvertisers = (syncedAdvertisers as any[]).map((adv: any) => {
      const { id: broadstreetId, _id, ...rest } = adv;
      return {
        ...rest,
        ...(typeof broadstreetId === 'number' ? { broadstreet_id: broadstreetId } : {}),
        mongo_id: _id?.toString?.() ?? String(_id),
      };
    });

    // Convert local advertisers and expose mongo_id (and optional broadstreet_id if synced previously)
    const convertedLocalAdvertisers = (localAdvertisers as any[]).map((local: any) => {
      const { _id, original_broadstreet_id, ...rest } = local;
      const shaped: any = {
        ...rest,
        mongo_id: _id?.toString?.() ?? String(_id),
      };
      if (typeof original_broadstreet_id === 'number') {
        shaped.broadstreet_id = original_broadstreet_id;
      }
      return shaped;
    });
    
    // Combine both collections with explicit IDs only
    const advertisers = [...shapedSyncedAdvertisers, ...convertedLocalAdvertisers]
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
    
    return NextResponse.json({ advertisers });
  } catch (error) {
    console.error('Error fetching advertisers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertisers' },
      { status: 500 }
    );
  }
}
