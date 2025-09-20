import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalAdvertiser from '@/lib/models/local-advertiser';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, networkId, webHomeUrl, notes, admins } = body;

    // Validate required fields
    if (!name || networkId === undefined || networkId === null) {
      return NextResponse.json(
        { message: 'Name and networkId are required' },
        { status: 400 }
      );
    }

    // Check if advertiser with same name already exists in this network
    const existingAdvertiser = await LocalAdvertiser.findOne({
      name: name.trim(),
      network_id: networkId
    });

    if (existingAdvertiser) {
      return NextResponse.json(
        { message: 'An advertiser with this name already exists in this network' },
        { status: 409 }
      );
    }

    // Create new local advertiser
    const newAdvertiser = new LocalAdvertiser({
      name: name.trim(),
      network_id: networkId,
      web_home_url: webHomeUrl || undefined,
      notes: notes || undefined,
      admins: admins || [],
      created_locally: true,
      synced_with_api: false,
      created_at: new Date(),
      sync_errors: [],
    });

    await newAdvertiser.save();

    return NextResponse.json({
      message: 'Advertiser created successfully',
      advertiser: {
        _id: newAdvertiser._id,
        name: newAdvertiser.name,
        network_id: newAdvertiser.network_id,
        web_home_url: newAdvertiser.web_home_url,
        notes: newAdvertiser.notes,
        admins: newAdvertiser.admins,
        created_locally: newAdvertiser.created_locally,
        synced_with_api: newAdvertiser.synced_with_api,
        created_at: newAdvertiser.created_at,
        sync_errors: newAdvertiser.sync_errors,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating advertiser:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
