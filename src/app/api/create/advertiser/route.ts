import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Advertiser from '@/lib/models/advertiser';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, network_id, web_home_url, notes, admins } = body;

    // Validate required fields
    if (!name || !network_id) {
      return NextResponse.json(
        { message: 'Name and network_id are required' },
        { status: 400 }
      );
    }

    // Check if advertiser with same name already exists in this network
    const existingAdvertiser = await Advertiser.findOne({
      name: name.trim(),
      network_id: network_id
    });

    if (existingAdvertiser) {
      return NextResponse.json(
        { message: 'An advertiser with this name already exists in this network' },
        { status: 409 }
      );
    }

    // Generate a unique ID (you might want to use a different strategy)
    const maxId = await Advertiser.findOne({}, { id: 1 }).sort({ id: -1 });
    const newId = maxId ? maxId.id + 1 : 1;

    // Create new advertiser
    const newAdvertiser = new Advertiser({
      id: newId,
      name: name.trim(),
      network_id,
      web_home_url: web_home_url || undefined,
      notes: notes || undefined,
      admins: admins || [],
      created_locally: true,
      synced_with_api: false,
      created_at: new Date(),
      synced_at: null,
    });

    await newAdvertiser.save();

    return NextResponse.json({
      message: 'Advertiser created successfully',
      advertiser: {
        id: newAdvertiser.id,
        name: newAdvertiser.name,
        network_id: newAdvertiser.network_id,
        web_home_url: newAdvertiser.web_home_url,
        notes: newAdvertiser.notes,
        admins: newAdvertiser.admins,
        created_locally: newAdvertiser.created_locally,
        synced_with_api: newAdvertiser.synced_with_api,
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
