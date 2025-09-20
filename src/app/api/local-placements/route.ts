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
  networkId: number;
  advertiserId: number;
  advertisementId: number;
  campaignId?: number;
  campaignMongoId?: string;
  zoneId?: number;
  zoneMongoId?: string;
  restrictions?: string[];
};

type GetPlacementsQuery = {
  networkId?: string;
  advertiserId?: string;
  campaignId?: string;
  campaignMongoId?: string;
  advertisementId?: string;
  zoneId?: string;
  zoneMongoId?: string;
  limit?: string;
};

// POST /api/local-placements - Create local placement
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body: CreatePlacementRequest = await request.json();
    
    // Validate required fields
    if (!body.networkId || !body.advertiserId || !body.advertisementId) {
      return NextResponse.json(
        { error: 'networkId, advertiserId, and advertisementId are required' },
        { status: 400 }
      );
    }

    // Validate XOR constraints
    const hasCampaignId = !!body.campaignId;
    const hasCampaignMongoId = !!body.campaignMongoId;
    const hasZoneId = !!body.zoneId;
    const hasZoneMongoId = !!body.zoneMongoId;

    if (hasCampaignId === hasCampaignMongoId) {
      return NextResponse.json(
        { error: 'Exactly one of campaignId or campaignMongoId must be provided' },
        { status: 400 }
      );
    }

    if (hasZoneId === hasZoneMongoId) {
      return NextResponse.json(
        { error: 'Exactly one of zoneId or zoneMongoId must be provided' },
        { status: 400 }
      );
    }

    // Validate entity dependencies exist
    const [advertisement, advertiser, network] = await Promise.all([
      Advertisement.findOne({ broadstreet_id: body.advertisementId }),
      Advertiser.findOne({ broadstreet_id: body.advertiserId }),
      Network.findOne({ broadstreet_id: body.networkId })
    ]);

    if (!advertisement) {
      return NextResponse.json(
        { error: `Advertisement with ID ${body.advertisementId} not found` },
        { status: 400 }
      );
    }

    if (!advertiser) {
      return NextResponse.json(
        { error: `Advertiser with ID ${body.advertiserId} not found` },
        { status: 400 }
      );
    }

    if (!network) {
      return NextResponse.json(
        { error: `Network with ID ${body.networkId} not found` },
        { status: 400 }
      );
    }

    // Validate campaign exists
    let campaign = null;
    if (body.campaignId) {
      campaign = await Campaign.findOne({ broadstreet_id: body.campaignId });
    } else if (body.campaignMongoId) {
      campaign = await LocalCampaign.findById(body.campaignMongoId);
    }

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 400 }
      );
    }

    // Validate zone exists
    let zone = null;
    if (body.zoneId) {
      zone = await Zone.findOne({ broadstreet_id: body.zoneId });
    } else if (body.zoneMongoId) {
      zone = await LocalZone.findById(body.zoneMongoId);
    }

    if (!zone) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 400 }
      );
    }

    // Create the placement - map camelCase to database field names
    const placementData = {
      network_id: body.networkId,
      advertiser_id: body.advertiserId,
      advertisement_id: body.advertisementId,
      ...(body.campaignId && { campaign_id: body.campaignId }),
      ...(body.campaignMongoId && { campaign_mongo_id: body.campaignMongoId }),
      ...(body.zoneId && { zone_id: body.zoneId }),
      ...(body.zoneMongoId && { zone_mongo_id: body.zoneMongoId }),
      ...(body.restrictions && body.restrictions.length > 0 && { restrictions: body.restrictions }),
      // Explicitly set local tracking flags
      created_locally: true,
      synced_with_api: false,
      created_at: new Date(),
      sync_errors: [],
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
    
    if (query.networkId) {
      filter.network_id = parseInt(query.networkId);
    }

    if (query.advertiserId) {
      filter.advertiser_id = parseInt(query.advertiserId);
    }

    if (query.advertisementId) {
      filter.advertisement_id = parseInt(query.advertisementId);
    }

    if (query.campaignId) {
      filter.campaign_id = parseInt(query.campaignId);
    }

    if (query.campaignMongoId) {
      filter.campaign_mongo_id = query.campaignMongoId;
    }
    
    if (query.zoneId) {
      filter.zone_id = parseInt(query.zoneId);
    }

    if (query.zoneMongoId) {
      filter.zone_mongo_id = query.zoneMongoId;
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
