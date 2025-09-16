import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Placement from '@/lib/models/placement';
import LocalCampaign from '@/lib/models/local-campaign';
import Campaign from '@/lib/models/campaign';
import LocalZone from '@/lib/models/local-zone';
import Zone from '@/lib/models/zone';
import Advertisement from '@/lib/models/advertisement';
import Advertiser from '@/lib/models/advertiser';
import Network from '@/lib/models/network';

type CreatePlacementRequest = {
  network_id: number;
  advertiser_id: number;
  advertisement_id: number;
  campaign_id?: number;
  campaign_mongo_id?: string;
  zone_id?: number;
  zone_mongo_id?: string;
  restrictions?: string[];
};

type GetPlacementsQuery = {
  network_id?: string;
  advertiser_id?: string;
  campaign_id?: string;
  campaign_mongo_id?: string;
  advertisement_id?: string;
  zone_id?: string;
  zone_mongo_id?: string;
  limit?: string;
};

// POST /api/local-placements - Create local placement
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body: CreatePlacementRequest = await request.json();
    
    // Validate required fields
    if (!body.network_id || !body.advertiser_id || !body.advertisement_id) {
      return NextResponse.json(
        { error: 'network_id, advertiser_id, and advertisement_id are required' },
        { status: 400 }
      );
    }
    
    // Validate XOR constraints
    const hasCampaignId = !!body.campaign_id;
    const hasCampaignMongoId = !!body.campaign_mongo_id;
    const hasZoneId = !!body.zone_id;
    const hasZoneMongoId = !!body.zone_mongo_id;
    
    if (hasCampaignId === hasCampaignMongoId) {
      return NextResponse.json(
        { error: 'Exactly one of campaign_id or campaign_mongo_id must be provided' },
        { status: 400 }
      );
    }
    
    if (hasZoneId === hasZoneMongoId) {
      return NextResponse.json(
        { error: 'Exactly one of zone_id or zone_mongo_id must be provided' },
        { status: 400 }
      );
    }
    
    // Validate entity dependencies exist
    const [advertisement, advertiser, network] = await Promise.all([
      Advertisement.findOne({ broadstreet_id: body.advertisement_id }),
      Advertiser.findOne({ broadstreet_id: body.advertiser_id }),
      Network.findOne({ broadstreet_id: body.network_id })
    ]);
    
    if (!advertisement) {
      return NextResponse.json(
        { error: `Advertisement with ID ${body.advertisement_id} not found` },
        { status: 400 }
      );
    }
    
    if (!advertiser) {
      return NextResponse.json(
        { error: `Advertiser with ID ${body.advertiser_id} not found` },
        { status: 400 }
      );
    }
    
    if (!network) {
      return NextResponse.json(
        { error: `Network with ID ${body.network_id} not found` },
        { status: 400 }
      );
    }
    
    // Validate campaign exists
    let campaign = null;
    if (body.campaign_id) {
      campaign = await Campaign.findOne({ broadstreet_id: body.campaign_id });
    } else if (body.campaign_mongo_id) {
      campaign = await LocalCampaign.findById(body.campaign_mongo_id);
    }
    
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 400 }
      );
    }
    
    // Validate zone exists
    let zone = null;
    if (body.zone_id) {
      zone = await Zone.findOne({ broadstreet_id: body.zone_id });
    } else if (body.zone_mongo_id) {
      zone = await LocalZone.findById(body.zone_mongo_id);
    }
    
    if (!zone) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 400 }
      );
    }
    
    // Create the placement
    const placementData = {
      network_id: body.network_id,
      advertiser_id: body.advertiser_id,
      advertisement_id: body.advertisement_id,
      ...(body.campaign_id && { campaign_id: body.campaign_id }),
      ...(body.campaign_mongo_id && { campaign_mongo_id: body.campaign_mongo_id }),
      ...(body.zone_id && { zone_id: body.zone_id }),
      ...(body.zone_mongo_id && { zone_mongo_id: body.zone_mongo_id }),
      ...(body.restrictions && body.restrictions.length > 0 && { restrictions: body.restrictions }),
    };
    
    const placement = new Placement(placementData);
    await placement.save();
    
    return NextResponse.json(
      { 
        message: 'Local placement created successfully',
        placement: placement.toObject()
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('Error creating local placement:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Placement with this combination already exists' },
        { status: 409 }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/local-placements - List local placements with filtering
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query: GetPlacementsQuery = Object.fromEntries(searchParams.entries());
    
    // Build MongoDB filter
    const filter: any = { created_locally: true };
    
    if (query.network_id) {
      filter.network_id = parseInt(query.network_id);
    }
    
    if (query.advertiser_id) {
      filter.advertiser_id = parseInt(query.advertiser_id);
    }
    
    if (query.advertisement_id) {
      filter.advertisement_id = parseInt(query.advertisement_id);
    }
    
    if (query.campaign_id) {
      filter.campaign_id = parseInt(query.campaign_id);
    }
    
    if (query.campaign_mongo_id) {
      filter.campaign_mongo_id = query.campaign_mongo_id;
    }
    
    if (query.zone_id) {
      filter.zone_id = parseInt(query.zone_id);
    }
    
    if (query.zone_mongo_id) {
      filter.zone_mongo_id = query.zone_mongo_id;
    }
    
    const limit = query.limit ? parseInt(query.limit) : 100;
    
    const placements = await Placement.find(filter)
      .limit(limit)
      .sort({ created_at: -1 })
      .lean();
    
    return NextResponse.json({
      placements,
      count: placements.length
    });
    
  } catch (error) {
    console.error('Error fetching local placements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
