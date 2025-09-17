import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Theme from '@/lib/models/theme';
import Zone from '@/lib/models/zone';

// POST /api/themes/[id]/zones - Add zones to theme
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { zone_ids } = body;

    if (!Array.isArray(zone_ids) || zone_ids.length === 0) {
      return NextResponse.json(
        { error: 'zone_ids array is required' },
        { status: 400 }
      );
    }

    const theme = await Theme.findById(id);
    
    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    // Validate that all zones are synced with Broadstreet
    const validZones = await Zone.find({
      broadstreet_id: { $in: zone_ids, $exists: true, $ne: null },
      synced_with_api: true
    }).lean();

    const validZoneIds = validZones.map(z => z.broadstreet_id);
    const invalidZoneIds = zone_ids.filter((zoneId: number) => !validZoneIds.includes(zoneId));

    if (invalidZoneIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid or unsynced zone IDs: ${invalidZoneIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Add zones to theme (deduplication handled by Set)
    const currentZoneIds = new Set(theme.zone_ids);
    validZoneIds.forEach(zoneId => currentZoneIds.add(zoneId));
    
    theme.zone_ids = Array.from(currentZoneIds);
    await theme.save();

    return NextResponse.json({ 
      theme: theme.toJSON(),
      message: `Added ${validZoneIds.length} zones to theme`,
      added_zones: validZoneIds
    });

  } catch (error) {
    console.error('Error adding zones to theme:', error);
    return NextResponse.json(
      { error: 'Failed to add zones to theme' },
      { status: 500 }
    );
  }
}

// DELETE /api/themes/[id]/zones - Remove zones from theme
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { zone_ids } = body;

    if (!Array.isArray(zone_ids) || zone_ids.length === 0) {
      return NextResponse.json(
        { error: 'zone_ids array is required' },
        { status: 400 }
      );
    }

    const theme = await Theme.findById(id);
    
    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    // Remove zones from theme
    const currentZoneIds = new Set(theme.zone_ids);
    const removedZones: number[] = [];
    
    zone_ids.forEach((zoneId: number) => {
      if (currentZoneIds.has(zoneId)) {
        currentZoneIds.delete(zoneId);
        removedZones.push(zoneId);
      }
    });
    
    theme.zone_ids = Array.from(currentZoneIds);
    await theme.save();

    return NextResponse.json({ 
      theme: theme.toJSON(),
      message: `Removed ${removedZones.length} zones from theme`,
      removed_zones: removedZones
    });

  } catch (error) {
    console.error('Error removing zones from theme:', error);
    return NextResponse.json(
      { error: 'Failed to remove zones from theme' },
      { status: 500 }
    );
  }
}
