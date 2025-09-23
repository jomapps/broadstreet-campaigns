import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalCampaign from '@/lib/models/local-campaign';
import Campaign from '@/lib/models/campaign';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, advertiserId, advertiserMongoId } = body;

    // Validate required fields
    if (!name || (!advertiserId && !advertiserMongoId)) {
      return NextResponse.json(
        { message: 'Name and advertiser ID (or Mongo ID) are required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return NextResponse.json(
        { message: 'Campaign name cannot be empty' },
        { status: 400 }
      );
    }

    // Normalize advertiser ID for consistent checking
    let normalizedAdvertiserId: number | string;
    if (typeof advertiserId === 'number') {
      normalizedAdvertiserId = advertiserId;
    } else if (advertiserMongoId) {
      normalizedAdvertiserId = advertiserMongoId;
    } else {
      return NextResponse.json(
        { message: 'Valid advertiser ID is required' },
        { status: 400 }
      );
    }

    // Check local campaigns first
    const existingLocalCampaign = await LocalCampaign.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }, // Case-insensitive exact match
      advertiser_id: normalizedAdvertiserId
    });

    if (existingLocalCampaign) {
      return NextResponse.json({
        exists: true,
        message: 'A campaign with this name already exists for this advertiser',
        source: 'local'
      });
    }

    // Check synced campaigns if we have a numeric advertiser ID
    if (typeof normalizedAdvertiserId === 'number') {
      const existingSyncedCampaign = await Campaign.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }, // Case-insensitive exact match
        advertiser_id: normalizedAdvertiserId
      });

      if (existingSyncedCampaign) {
        return NextResponse.json({
          exists: true,
          message: 'A campaign with this name already exists for this advertiser',
          source: 'synced'
        });
      }
    }

    // Name is unique
    return NextResponse.json({
      exists: false,
      message: 'Campaign name is available'
    });

  } catch (error) {
    console.error('Campaign name validation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown validation error',
        message: 'Unable to validate campaign name at this time'
      },
      { status: 500 }
    );
  }
}
