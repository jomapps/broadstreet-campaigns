import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Theme from '@/lib/models/theme';
import Zone from '@/lib/models/zone';

// GET /api/themes - List all themes with zone counts
export async function GET() {
  try {
    await connectDB();
    
    const themes = await Theme.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ themes });
  } catch (error) {
    console.error('Error fetching themes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch themes' },
      { status: 500 }
    );
  }
}

// POST /api/themes - Create new theme
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, description, zone_ids = [] } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Theme name is required' },
        { status: 400 }
      );
    }

    // Check if theme with same name already exists
    const existingTheme = await Theme.findOne({
      name: name.trim()
    });

    if (existingTheme) {
      return NextResponse.json(
        { error: 'A theme with this name already exists' },
        { status: 409 }
      );
    }

    // Validate zone_ids if provided
    if (zone_ids.length > 0) {
      // Ensure all zones are synced with Broadstreet
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
    }

    // Create new theme
    const newTheme = new Theme({
      name: name.trim(),
      description: description?.trim() || undefined,
      zone_ids: [...new Set(zone_ids)] // Remove duplicates
    });

    await newTheme.save();

    return NextResponse.json({ 
      theme: newTheme.toJSON(),
      message: 'Theme created successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating theme:', error);
    return NextResponse.json(
      { error: 'Failed to create theme' },
      { status: 500 }
    );
  }
}
