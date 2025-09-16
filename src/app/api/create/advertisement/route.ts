import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Advertisement from '@/lib/models/advertisement';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, type, preview_url, target_url, notes } = body;

    // Validate required fields
    if (!name || !type || !preview_url) {
      return NextResponse.json(
        { message: 'Name, type, and preview_url are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['image', 'text', 'video', 'native'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { message: 'Type must be one of: image, text, video, native' },
        { status: 400 }
      );
    }

    // Check if advertisement with same name already exists
    const existingAdvertisement = await Advertisement.findOne({
      name: name.trim()
    });

    if (existingAdvertisement) {
      return NextResponse.json(
        { message: 'An advertisement with this name already exists' },
        { status: 409 }
      );
    }

    // Generate a unique Broadstreet ID
    const maxId = await Advertisement.findOne({}, { broadstreet_id: 1 }).sort({ broadstreet_id: -1 });
    const newBroadstreetId = maxId ? maxId.broadstreet_id + 1 : 1;

    // Create new advertisement
    const newAdvertisement = new Advertisement({
      broadstreet_id: newBroadstreetId,
      name: name.trim(),
      type,
      preview_url,
      active: {
        url: target_url || null
      },
      active_placement: false,
      advertiser: 'Unknown', // This will be set when synced with API
      updated_at: new Date().toISOString(),
      notes: notes || undefined,
      created_locally: true,
      synced_with_api: false,
      created_at: new Date(),
      synced_at: null,
    });

    await newAdvertisement.save();

    return NextResponse.json({
      message: 'Advertisement created successfully',
      advertisement: {
        broadstreet_id: newAdvertisement.broadstreet_id,
        mongo_id: newAdvertisement._id?.toString(),
        name: newAdvertisement.name,
        type: newAdvertisement.type,
        preview_url: newAdvertisement.preview_url,
        active: newAdvertisement.active,
        active_placement: newAdvertisement.active_placement,
        advertiser: newAdvertisement.advertiser,
        notes: newAdvertisement.notes,
        created_locally: newAdvertisement.created_locally,
        synced_with_api: newAdvertisement.synced_with_api,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating advertisement:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
