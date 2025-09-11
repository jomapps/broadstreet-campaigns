import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalZone from '@/lib/models/local-zone';
import LocalAdvertiser from '@/lib/models/local-advertiser';
import LocalCampaign from '@/lib/models/local-campaign';
import LocalNetwork from '@/lib/models/local-network';
import LocalAdvertisement from '@/lib/models/local-advertisement';
import Advertiser from '@/lib/models/advertiser';
import Network from '@/lib/models/network';

export async function GET() {
  try {
    await connectDB();
    
    // Fetch all local entities that haven't been synced
    const [localZones, localAdvertisers, localCampaigns, localNetworks, localAdvertisements] = await Promise.all([
      LocalZone.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
      LocalAdvertiser.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
      LocalCampaign.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
      LocalNetwork.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
      LocalAdvertisement.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
    ]);
    
    // Also fetch locally created advertisers from the main Advertiser collection
    const mainLocalAdvertisers = await Advertiser.find({ 
      synced_with_api: false,
      created_locally: true 
    }).sort({ created_at: -1 }).lean();
    
    // Convert main advertisers to LocalEntity format for display
    const convertedMainAdvertisers = mainLocalAdvertisers.map(advertiser => {
      // Use JSON.stringify/parse to properly serialize ObjectIds
      const serialized = JSON.parse(JSON.stringify(advertiser));
      return {
        ...serialized,
        _id: advertiser._id.toString(),
        created_at: advertiser.created_at || new Date(),
        type: 'advertiser' as const,
      };
    });
    
    // Combine local advertisers from both collections
    const allLocalAdvertisers = [
      ...localAdvertisers.map(advertiser => ({
        ...advertiser,
        _id: advertiser._id.toString(),
        created_at: advertiser.created_at.toISOString(),
        type: 'advertiser' as const,
      })),
      ...convertedMainAdvertisers
    ];
    
    // Get network names for display
    const networkIds = [...new Set([
      ...localZones.map(z => z.network_id),
      ...allLocalAdvertisers.map(a => a.network_id),
      ...localCampaigns.map(c => c.network_id),
      ...localNetworks.map(n => n.id),
      ...localAdvertisements.map(ad => ad.network_id),
    ])];
    
    const networks = await Network.find({ id: { $in: networkIds } }).lean();
    const networkMap = new Map(networks.map(n => [n.id, n.name]));

    // Get advertiser names for display
    const advertiserIds = [...new Set([
      ...localCampaigns.map(c => c.advertiser_id),
      ...allLocalAdvertisers.map(a => a._id),
    ])].filter(id => id !== undefined && id !== null);
    
    // Fetch both local and synced advertisers for names
    const [localAdvertisersForNames, syncedAdvertisers] = await Promise.all([
      LocalAdvertiser.find({ synced_with_api: false }).lean(),
      Advertiser.find({ id: { $in: advertiserIds } }).lean(),
    ]);
    
    const advertiserMap = new Map([
      ...localAdvertisersForNames.map(a => [a._id.toString(), a.name]),
      ...syncedAdvertisers.map(a => [a.id.toString(), a.name]),
    ]);

    // Serialize the data properly
    const serializedData = {
      zones: localZones.map(zone => ({
        ...zone,
        _id: zone._id.toString(),
        created_at: zone.created_at.toISOString(),
        type: 'zone' as const,
      })),
      advertisers: allLocalAdvertisers,
      campaigns: localCampaigns.map(campaign => ({
        ...campaign,
        _id: campaign._id.toString(),
        created_at: campaign.created_at.toISOString(),
        type: 'campaign' as const,
      })),
      networks: localNetworks.map(network => ({
        ...network,
        _id: network._id.toString(),
        created_at: network.created_at.toISOString(),
        type: 'network' as const,
      })),
      advertisements: localAdvertisements.map(advertisement => ({
        ...advertisement,
        _id: advertisement._id.toString(),
        created_at: advertisement.created_at.toISOString(),
        type: 'advertisement' as const,
      })),
      networkMap: Object.fromEntries(networkMap),
      advertiserMap: Object.fromEntries(advertiserMap),
    };

    return NextResponse.json(serializedData);
  } catch (error) {
    console.error('Error fetching local entities:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
