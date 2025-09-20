import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Network from '@/lib/models/network';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, webHomeUrl, path, valetActive, notes } = body;

    // Validate required fields
    if (!name || !path) {
      return NextResponse.json(
        { message: 'Name and path are required' },
        { status: 400 }
      );
    }

    // Check if network with same name already exists
    const existingNetwork = await Network.findOne({
      name: name.trim()
    });

    if (existingNetwork) {
      return NextResponse.json(
        { message: 'A network with this name already exists' },
        { status: 409 }
      );
    }

    // Check if network with same path already exists
    const existingPath = await Network.findOne({
      path: path.trim()
    });

    if (existingPath) {
      return NextResponse.json(
        { message: 'A network with this path already exists' },
        { status: 409 }
      );
    }

    // Generate a unique Broadstreet ID
    const maxId = await Network.findOne({}, { broadstreet_id: 1 }).sort({ broadstreet_id: -1 });
    const newBroadstreetId = maxId ? maxId.broadstreet_id + 1 : 1;

    // Create new network
    const newNetwork = new Network({
      broadstreet_id: newBroadstreetId,
      name: name.trim(),
      group_id: null,
      web_home_url: webHomeUrl || undefined,
      logo: undefined,
      valet_active: valetActive || false,
      path: path.trim(),
      advertiser_count: 0,
      zone_count: 0,
      notes: notes || undefined,
      created_locally: true,
      synced_with_api: false,
      created_at: new Date(),
      synced_at: null,
    });

    await newNetwork.save();

    return NextResponse.json({
      message: 'Network created successfully',
      network: {
        broadstreet_id: newNetwork.broadstreet_id,
        mongo_id: newNetwork._id?.toString(),
        name: newNetwork.name,
        group_id: newNetwork.group_id,
        web_home_url: newNetwork.web_home_url,
        logo: newNetwork.logo,
        valet_active: newNetwork.valet_active,
        path: newNetwork.path,
        advertiser_count: newNetwork.advertiser_count,
        zone_count: newNetwork.zone_count,
        notes: newNetwork.notes,
        created_locally: newNetwork.created_locally,
        synced_with_api: newNetwork.synced_with_api,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating network:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
