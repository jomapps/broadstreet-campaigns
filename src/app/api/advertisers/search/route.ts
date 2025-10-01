import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Advertiser from '@/lib/models/advertiser';
import LocalAdvertiser from '@/lib/models/local-advertiser';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const networkId = searchParams.get('networkId');
    
    if (!query || query.length < 2) {
      return NextResponse.json({ advertisers: [] });
    }
    
    // Search in both synced and local advertisers
    const searchRegex = new RegExp(query, 'i');
    
    // Search synced advertisers
    const syncedAdvertisers = await Advertiser.find({
      name: searchRegex,
      ...(networkId && { network_id: parseInt(networkId) }),
    })
      .select('broadstreet_id name web_home_url network_id')
      .limit(10)
      .lean();
    
    // Search local advertisers
    const localAdvertisers = await LocalAdvertiser.find({
      name: searchRegex,
      ...(networkId && { network_id: parseInt(networkId) }),
    })
      .select('mongo_id name web_home_url network_id')
      .limit(10)
      .lean();
    
    // Combine and format results
    const results = [
      ...syncedAdvertisers.map(adv => ({
        id: adv.broadstreet_id?.toString() || '',
        name: adv.name,
        website: adv.web_home_url,
        type: 'synced' as const,
        network_id: adv.network_id,
      })),
      ...localAdvertisers.map(adv => ({
        id: adv.mongo_id?.toString() || adv._id?.toString() || '',
        name: adv.name,
        website: adv.web_home_url,
        type: 'local' as const,
        network_id: adv.network_id,
      })),
    ];
    
    // Remove duplicates by name and sort by name
    const uniqueResults = results
      .filter((adv, index, self) => 
        index === self.findIndex(a => a.name.toLowerCase() === adv.name.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 10);
    
    return NextResponse.json({ advertisers: uniqueResults });
  } catch (error) {
    console.error('Advertiser search error:', error);
    return NextResponse.json(
      { error: 'Failed to search advertisers' },
      { status: 500 }
    );
  }
}
