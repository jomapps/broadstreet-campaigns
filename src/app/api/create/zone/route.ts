import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalZone from '@/lib/models/local-zone';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { 
      name, 
      network_id, 
      alias,
      advertisement_count,
      allow_duplicate_ads,
      concurrent_campaigns,
      advertisement_label,
      archived,
      display_type,
      rotation_interval,
      animation_type,
      width,
      height,
      rss_shuffle,
      style,
      self_serve
    } = body;

    // Validate required fields
    if (!name || !network_id) {
      return NextResponse.json(
        { message: 'Name and network_id are required' },
        { status: 400 }
      );
    }

    // Check if zone with same name already exists in this network
    const existingZone = await LocalZone.findOne({
      name: name.trim(),
      network_id: parseInt(network_id)
    });

    if (existingZone) {
      return NextResponse.json(
        { message: 'A zone with this name already exists in this network' },
        { status: 409 }
      );
    }

    // Check if alias is unique if provided
    if (alias) {
      const existingAlias = await LocalZone.findOne({
        alias: alias.trim(),
        network_id: parseInt(network_id)
      });

      if (existingAlias) {
        return NextResponse.json(
          { message: 'A zone with this alias already exists in this network' },
          { status: 409 }
        );
      }
    }

    // Create new local zone with only provided fields
    const zoneData: any = {
      name: name.trim(),
      network_id: parseInt(network_id),
      created_locally: true,
      synced_with_api: false,
      created_at: new Date(),
      sync_errors: [],
    };

    // Only add optional fields if they are provided
    if (alias !== undefined && alias?.trim()) {
      zoneData.alias = alias.trim();
    }
    if (advertisement_count !== undefined) {
      zoneData.advertisement_count = advertisement_count;
    }
    if (allow_duplicate_ads !== undefined) {
      zoneData.allow_duplicate_ads = allow_duplicate_ads;
    }
    if (concurrent_campaigns !== undefined) {
      zoneData.concurrent_campaigns = concurrent_campaigns;
    }
    if (advertisement_label !== undefined && advertisement_label?.trim()) {
      zoneData.advertisement_label = advertisement_label.trim();
    }
    if (archived !== undefined) {
      zoneData.archived = archived;
    }
    if (display_type !== undefined && (display_type === 'standard' || display_type === 'rotation')) {
      zoneData.display_type = display_type;
    }
    if (rotation_interval !== undefined && display_type === 'rotation') {
      zoneData.rotation_interval = rotation_interval;
    }
    if (animation_type !== undefined && animation_type !== 'none') {
      zoneData.animation_type = animation_type;
    }
    if (width !== undefined) {
      zoneData.width = width;
    }
    if (height !== undefined) {
      zoneData.height = height;
    }
    if (rss_shuffle !== undefined) {
      zoneData.rss_shuffle = rss_shuffle;
    }
    if (style !== undefined && style?.trim()) {
      zoneData.style = style.trim();
    }
    if (self_serve !== undefined) {
      zoneData.self_serve = self_serve;
    }

    const newZone = new LocalZone(zoneData);

    await newZone.save();

    return NextResponse.json({
      message: 'Zone created successfully',
      zone: {
        id: newZone._id,
        name: newZone.name,
        network_id: newZone.network_id,
        alias: newZone.alias,
        advertisement_count: newZone.advertisement_count,
        allow_duplicate_ads: newZone.allow_duplicate_ads,
        concurrent_campaigns: newZone.concurrent_campaigns,
        advertisement_label: newZone.advertisement_label,
        archived: newZone.archived,
        display_type: newZone.display_type,
        rotation_interval: newZone.rotation_interval,
        animation_type: newZone.animation_type,
        width: newZone.width,
        height: newZone.height,
        rss_shuffle: newZone.rss_shuffle,
        style: newZone.style,
        self_serve: newZone.self_serve,
        created_locally: newZone.created_locally,
        synced_with_api: newZone.synced_with_api,
        created_at: newZone.created_at,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating zone:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}