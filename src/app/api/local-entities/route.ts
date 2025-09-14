import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalZone from '@/lib/models/local-zone';
import LocalAdvertiser from '@/lib/models/local-advertiser';
import LocalCampaign from '@/lib/models/local-campaign';
import LocalNetwork from '@/lib/models/local-network';
import LocalAdvertisement from '@/lib/models/local-advertisement';
import Advertiser from '@/lib/models/advertiser';

export async function GET() {
  try {
    await connectDB();

    const [localZones, localAdvertisers, localCampaigns, localNetworks, localAdvertisements] = await Promise.all([
      LocalZone.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
      LocalAdvertiser.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
      LocalCampaign.find({ $or: [{ synced_with_api: false }, { 'placements.0': { $exists: true } }] }).sort({ created_at: -1 }).lean(),
      LocalNetwork.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
      LocalAdvertisement.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
    ]);

    const mainLocalAdvertisers = await Advertiser.find({
      synced_with_api: false,
      created_locally: true,
    }).select('-id').sort({ created_at: -1 }).lean();

    const convertedMainAdvertisers = mainLocalAdvertisers.map((advertiser: any) => {
      const { _id, ...rest } = advertiser;
      return {
        ...rest,
        mongo_id: _id.toString(),
        local_advertiser_id: _id.toString(),
        ...(typeof advertiser.original_broadstreet_id === 'number' ? { broadstreet_id: advertiser.original_broadstreet_id } : {}),
        ...(typeof advertiser.original_broadstreet_id === 'number' ? { broadstreet_advertiser_id: advertiser.original_broadstreet_id } : {}),
        created_at: (advertiser.created_at || new Date()).toISOString(),
        type: 'advertiser' as const,
      };
    });

    const zones = localZones.map((zone: any) => {
      const { _id, created_at, ...rest } = zone;
      return {
        ...rest,
        mongo_id: _id.toString(),
        local_zone_id: _id.toString(),
        created_at: (created_at || new Date()).toISOString(),
        type: 'zone' as const,
        ...(typeof zone.original_broadstreet_id === 'number' ? { broadstreet_id: zone.original_broadstreet_id } : {}),
        ...(typeof zone.original_broadstreet_id === 'number' ? { broadstreet_zone_id: zone.original_broadstreet_id } : {}),
      };
    });

    const advertisers = [
      ...localAdvertisers.map((a: any) => {
        const { _id, created_at, ...rest } = a;
        return {
          ...rest,
          mongo_id: _id.toString(),
          local_advertiser_id: _id.toString(),
          ...(typeof a.original_broadstreet_id === 'number' ? { broadstreet_id: a.original_broadstreet_id } : {}),
          ...(typeof a.original_broadstreet_id === 'number' ? { broadstreet_advertiser_id: a.original_broadstreet_id } : {}),
          created_at: (created_at || new Date()).toISOString(),
          type: 'advertiser' as const,
        };
      }),
      ...convertedMainAdvertisers,
    ];

    const campaigns = localCampaigns.map((c: any) => {
      const { _id, created_at, ...rest } = c;
      return {
        ...rest,
        mongo_id: _id.toString(),
        local_campaign_id: _id.toString(),
        ...(typeof c.original_broadstreet_id === 'number' ? { broadstreet_id: c.original_broadstreet_id } : {}),
        ...(typeof c.original_broadstreet_id === 'number' ? { broadstreet_campaign_id: c.original_broadstreet_id } : {}),
        created_at: (created_at || new Date()).toISOString(),
        type: 'campaign' as const,
      };
    });

    const networks = localNetworks.map((n: any) => {
      const { _id, created_at, ...rest } = n;
      return {
        ...rest,
        mongo_id: _id.toString(),
        local_network_id: _id.toString(),
        ...(typeof n.original_broadstreet_id === 'number' ? { broadstreet_id: n.original_broadstreet_id } : {}),
        ...(typeof n.original_broadstreet_id === 'number' ? { broadstreet_network_id: n.original_broadstreet_id } : {}),
        created_at: (created_at || new Date()).toISOString(),
        type: 'network' as const,
      };
    });

    const advertisements = localAdvertisements.map((ad: any) => {
      const { _id, created_at, ...rest } = ad;
      return {
        ...rest,
        mongo_id: _id.toString(),
        local_advertisement_id: _id.toString(),
        ...(typeof ad.original_broadstreet_id === 'number' ? { broadstreet_id: ad.original_broadstreet_id } : {}),
        ...(typeof ad.original_broadstreet_id === 'number' ? { broadstreet_advertisement_id: ad.original_broadstreet_id } : {}),
        created_at: (created_at || new Date()).toISOString(),
        type: 'advertisement' as const,
      };
    });

    return NextResponse.json({
      zones,
      advertisers,
      campaigns,
      networks,
      advertisements,
    });
  } catch (error) {
    console.error('Error fetching local entities:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
