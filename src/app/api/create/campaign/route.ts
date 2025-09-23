import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalCampaign from '@/lib/models/local-campaign';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      name,
      networkId,
      advertiserId,
      advertiser, // optional { broadstreetId?: number; mongoId?: string }
      startDate,
      endDate,
      weight,
      maxImpressionCount,
      displayType,
      pacingType,
      impressionMaxType,
      path,
      notes,
      active,
      archived,
      paused,
    } = body;

    // Validate required fields
    if (!name || networkId === undefined || networkId === null ||
        (advertiserId === undefined && !advertiser) ||
        !startDate || weight === undefined || weight === null) {
      return NextResponse.json(
        { message: 'Name, networkId, advertiser (id or object), startDate, and weight are required' },
        { status: 400 }
      );
    }

    // Resolve normalized advertiser identifier for local storage and duplicate checks
    const normalizedAdvertiserId: number | string | undefined =
      typeof advertiserId === 'number'
        ? advertiserId
        : (advertiser && typeof advertiser.broadstreetId === 'number')
          ? advertiser.broadstreetId
          : (advertiser && typeof advertiser.mongoId === 'string')
            ? advertiser.mongoId
            : undefined;

    if (normalizedAdvertiserId === undefined) {
      return NextResponse.json(
        { message: 'Unable to resolve advertiser identifier (expected broadstreet_id number or mongo_id string)' },
        { status: 400 }
      );
    }

    // Check if campaign with same name already exists for this advertiser (local duplicate check)
    const existingCampaign = await LocalCampaign.findOne({
      name: name.trim(),
      advertiser_id: normalizedAdvertiserId
    });

    if (existingCampaign) {
      return NextResponse.json(
        { message: 'A campaign with this name already exists for this advertiser' },
        { status: 409 }
      );
    }

    // Create new local campaign
    const newCampaign = new LocalCampaign({
      name: name.trim(),
      network_id: networkId,
      advertiser_id: normalizedAdvertiserId,
      start_date: startDate,
      end_date: endDate || undefined,
      weight,
      max_impression_count: maxImpressionCount || undefined,
      display_type: displayType || 'allow_repeat_advertisement',
      pacing_type: pacingType || 'asap',
      impression_max_type: impressionMaxType || undefined,
      path: path || undefined,
      notes: notes || undefined,
      active: active !== undefined ? !!active : true,
      paused: paused !== undefined ? !!paused : false,
      archived: archived !== undefined ? !!archived : false,
      placements: [], // Start with empty placements
      created_locally: true,
      synced_with_api: false,
      created_at: new Date(),
      synced_at: null,
    });

    await newCampaign.save();

    return NextResponse.json({
      message: 'Campaign created successfully',
      campaign: {
        _id: newCampaign._id,
        name: newCampaign.name,
        network_id: newCampaign.network_id,
        advertiser_id: newCampaign.advertiser_id,
        start_date: newCampaign.start_date,
        end_date: newCampaign.end_date,
        weight: newCampaign.weight,
        max_impression_count: newCampaign.max_impression_count,
        display_type: newCampaign.display_type,
        pacing_type: newCampaign.pacing_type,
        impression_max_type: newCampaign.impression_max_type,
        path: newCampaign.path,
        notes: newCampaign.notes,
        active: newCampaign.active,
        archived: newCampaign.archived,
        paused: newCampaign.paused,
        created_locally: newCampaign.created_locally,
        synced_with_api: newCampaign.synced_with_api,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
