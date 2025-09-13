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

    const convertedMainAdvertisers = mainLocalAdvertisers.map((advertiser: any) => ({
      _id: advertiser._id.toString(),
      name: advertiser.name,
      network_id: advertiser.network_id,
      web_home_url: advertiser.web_home_url,
      notes: advertiser.notes,
      admins: advertiser.admins,
      created_locally: advertiser.created_locally,
      synced_with_api: advertiser.synced_with_api,
      created_at: (advertiser.created_at || new Date()).toISOString(),
      type: 'advertiser' as const,
    }));

    const zones = localZones.map((zone: any) => ({
      ...zone,
      _id: zone._id.toString(),
      created_at: zone.created_at.toISOString(),
      type: 'zone' as const,
    }));

    const advertisers = [
      ...localAdvertisers.map((a: any) => ({
        ...a,
        _id: a._id.toString(),
        created_at: a.created_at.toISOString(),
        type: 'advertiser' as const,
      })),
      ...convertedMainAdvertisers,
    ];

    const campaigns = localCampaigns.map((c: any) => ({
      ...c,
      _id: c._id.toString(),
      created_at: c.created_at.toISOString(),
      type: 'campaign' as const,
    }));

    const networks = localNetworks.map((n: any) => ({
      ...n,
      _id: n._id.toString(),
      created_at: n.created_at.toISOString(),
      type: 'network' as const,
    }));

    const advertisements = localAdvertisements.map((ad: any) => ({
      ...ad,
      _id: ad._id.toString(),
      created_at: ad.created_at.toISOString(),
      type: 'advertisement' as const,
    }));

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
