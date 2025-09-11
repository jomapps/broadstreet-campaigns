import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Zone from '@/lib/models/zone';
import Placement from '@/lib/models/placement';
import { ZoneSize } from '@/lib/types/broadstreet';

interface CreateFallbackAdRequest {
  networkId: number;
  advertiserId: number;
  campaignId: number;
  advertisementIds: number[];
  sizes: ZoneSize[];
}

export async function POST(request: Request) {
  try {
    const {
      networkId,
      advertiserId,
      campaignId,
      advertisementIds,
      sizes
    }: CreateFallbackAdRequest = await request.json();
    
    if (!networkId || !advertiserId || !campaignId || !advertisementIds.length || !sizes.length) {
      return NextResponse.json({
        success: false,
        message: 'All fields are required',
      }, { status: 400 });
    }

    await connectDB();
    
    // Find zones that match the selected sizes
    const matchedZones = await Zone.find({
      network_id: networkId,
      size_type: { $in: sizes }
    }).lean();

    if (matchedZones.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No zones found matching the selected sizes',
      }, { status: 400 });
    }

    let placementsCreated = 0;
    const createdPlacements = [];
    const errors = [];

    // Create placements for each advertisement and zone combination
    for (const advertisementId of advertisementIds) {
      for (const zone of matchedZones) {
        try {
          // Create placement locally in database only
          const placement = await Placement.create({
            advertisement_id: advertisementId,
            zone_id: zone.id,
            campaign_id: campaignId,
            restrictions: [], // No default restrictions - user must specify
          });
          
          createdPlacements.push({
            advertisement_id: advertisementId,
            zone_id: zone.id,
            campaign_id: campaignId,
            restrictions: placement.restrictions,
          });
          placementsCreated++;
        } catch (error) {
          const errorMessage = `Failed to create placement for ad ${advertisementId} in zone ${zone.name}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`;
          errors.push(errorMessage);
          console.error(errorMessage);
        }
      }
    }

    if (placementsCreated === 0) {
      return NextResponse.json({
        success: false,
        message: 'Failed to create any placements',
        errors,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${placementsCreated} placements`,
      placementsCreated,
      placements: createdPlacements,
      zonesMatched: matchedZones,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Create fallback ad error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create fallback ad',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
