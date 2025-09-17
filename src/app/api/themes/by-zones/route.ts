import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getThemesByZoneIds } from '@/lib/theme-service';

// POST /api/themes/by-zones - Get themes for multiple zone IDs
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { zone_ids } = body;
    
    if (!Array.isArray(zone_ids)) {
      return NextResponse.json(
        { error: 'zone_ids array is required' },
        { status: 400 }
      );
    }
    
    const themesByZone = await getThemesByZoneIds(zone_ids);
    
    // Convert Map to object for JSON response
    const result: Record<number, any[]> = {};
    themesByZone.forEach((themes, zoneId) => {
      result[zoneId] = themes;
    });
    
    return NextResponse.json({ themes_by_zone: result });
  } catch (error) {
    console.error('Error fetching themes by zones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch themes by zones' },
      { status: 500 }
    );
  }
}
