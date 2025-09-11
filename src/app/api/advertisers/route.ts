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
      LocalAdvertiser.find({ 
        network_id: parseInt(networkId),
        synced_with_api: false 
      }).sort({ name: 1 }).lean()
    ]);
    
    // Convert local advertisers to the same format as main advertisers for display
    const convertedLocalAdvertisers = localAdvertisers.map(local => ({
      id: local._id.toString(), // Use _id as id for local advertisers
      name: local.name,
      network_id: local.network_id,
      web_home_url: local.web_home_url,
      notes: local.notes,
      admins: local.admins,
      created_locally: local.created_locally,
      synced_with_api: local.synced_with_api,
      created_at: local.created_at,
      _id: local._id,
      sync_errors: local.sync_errors,
    }));
    
    // Combine both collections
    const advertisers = [...syncedAdvertisers, ...convertedLocalAdvertisers].sort((a, b) => a.name.localeCompare(b.name));
    
    return NextResponse.json({ advertisers });
  } catch (error) {
    console.error('Error fetching advertisers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertisers' },
      { status: 500 }
    );
  }
}
