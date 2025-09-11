import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalCampaign from '@/lib/models/local-campaign';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      name,
      network_id,
      advertiser_id,
      start_date,
      end_date,
      weight,
      max_impression_count,
      display_type,
      pacing_type,
      notes
    } = body;

    // Validate required fields
    if (!name || network_id === undefined || network_id === null || 
        advertiser_id === undefined || advertiser_id === null || 
        !start_date || weight === undefined || weight === null) {
      return NextResponse.json(
        { message: 'Name, network_id, advertiser_id, start_date, and weight are required' },
        { status: 400 }
      );
    }

    // Check if campaign with same name already exists for this advertiser
    const existingCampaign = await LocalCampaign.findOne({
      name: name.trim(),
      advertiser_id: advertiser_id
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
      network_id,
      advertiser_id,
      start_date: start_date, // Keep as string for LocalCampaign model
      end_date: end_date || undefined,
      weight,
      max_impression_count: max_impression_count || undefined,
      display_type: display_type || 'no_repeat',
      pacing_type: pacing_type || 'asap',
      notes: notes || undefined,
      active: true,
      paused: false,
      archived: false,
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
        notes: newCampaign.notes,
        active: newCampaign.active,
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
