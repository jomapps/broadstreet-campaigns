import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalZone from '@/lib/models/local-zone';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      name,
      networkId,
      alias,
      advertisementCount,
      allowDuplicateAds,
      concurrentCampaigns,
      advertisementLabel,
      archived,
      displayType,
      rotationInterval,
      animationType,
      width,
      height,
      rssShuffle,
      style,
      selfServe
    } = body;

    // Validate required fields
    const netIdNum = typeof networkId === 'string' ? parseInt(networkId, 10) : Number(networkId);
    if (!name || !Number.isFinite(netIdNum)) {
      return NextResponse.json(
        { message: 'Name and networkId are required' },
        { status: 400 }
      );
    }

    // Duplicate names are allowed. Do not block on same name in a network.

    // Check if alias is unique if provided (we only enforce when alias is specified)
    if (alias) {
      const existingAlias = await LocalZone.findOne({
        alias: alias.trim(),
        network_id: netIdNum
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
      network_id: netIdNum,
      created_locally: true,
      synced_with_api: false,
      created_at: new Date(),
      sync_errors: [],
    };

    // Only add optional fields if they are provided
    if (alias !== undefined && alias?.trim()) {
      zoneData.alias = alias.trim();
    }
    if (advertisementCount !== undefined) {
      zoneData.advertisement_count = advertisementCount;
    }
    if (allowDuplicateAds !== undefined) {
      zoneData.allow_duplicate_ads = allowDuplicateAds;
    }
    if (concurrentCampaigns !== undefined) {
      zoneData.concurrent_campaigns = concurrentCampaigns;
    }
    if (advertisementLabel !== undefined && advertisementLabel?.trim()) {
      zoneData.advertisement_label = advertisementLabel.trim();
    }
    if (archived !== undefined) {
      zoneData.archived = archived;
    }
    if (displayType !== undefined && (displayType === 'standard' || displayType === 'rotation')) {
      zoneData.display_type = displayType;
    }
    if (rotationInterval !== undefined && displayType === 'rotation') {
      zoneData.rotation_interval = rotationInterval;
    }
    if (animationType !== undefined && animationType !== 'none') {
      zoneData.animation_type = animationType;
    }
    if (width !== undefined) {
      zoneData.width = width;
    }
    if (height !== undefined) {
      zoneData.height = height;
    }
    if (rssShuffle !== undefined) {
      zoneData.rss_shuffle = rssShuffle;
    }
    if (style !== undefined && style?.trim()) {
      zoneData.style = style.trim();
    }
    if (selfServe !== undefined) {
      zoneData.self_serve = selfServe;
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