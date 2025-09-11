import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalAdvertiser from '@/lib/models/local-advertiser';
import LocalCampaign from '@/lib/models/local-campaign';
import LocalZone from '@/lib/models/local-zone';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const entityType = searchParams.get('type') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build search regex for case-insensitive search
    const searchRegex = search ? new RegExp(search, 'i') : null;

    // Build query for synced entities
    const baseQuery = {
      synced_with_api: true,
      ...(searchRegex && { name: searchRegex })
    };

    // Get all synced entities
    const [advertisers, campaigns, zones] = await Promise.all([
      entityType === '' || entityType === 'advertiser' 
        ? LocalAdvertiser.find(baseQuery)
            .sort({ synced_at: -1 })
            .limit(limit)
            .skip(offset)
            .lean()
        : [],
      
      entityType === '' || entityType === 'campaign'
        ? LocalCampaign.find(baseQuery)
            .sort({ synced_at: -1 })
            .limit(limit)
            .skip(offset)
            .lean()
        : [],
      
      entityType === '' || entityType === 'zone'
        ? LocalZone.find(baseQuery)
            .sort({ synced_at: -1 })
            .limit(limit)
            .skip(offset)
            .lean()
        : []
    ]);

    // Transform entities to include type and format data
    const allEntities = [
      ...advertisers.map(entity => ({
        ...entity,
        type: 'advertiser',
        entity_id: entity._id,
        broadstreet_id: entity.original_broadstreet_id,
        synced_at: entity.synced_at,
        created_at: entity.created_at
      })),
      ...campaigns.map(entity => ({
        ...entity,
        type: 'campaign',
        entity_id: entity._id,
        broadstreet_id: entity.original_broadstreet_id,
        synced_at: entity.synced_at,
        created_at: entity.created_at
      })),
      ...zones.map(entity => ({
        ...entity,
        type: 'zone',
        entity_id: entity._id,
        broadstreet_id: entity.original_broadstreet_id,
        synced_at: entity.synced_at,
        created_at: entity.created_at
      }))
    ];

    // Sort all entities by sync date (most recent first)
    allEntities.sort((a, b) => new Date(b.synced_at).getTime() - new Date(a.synced_at).getTime());

    // Get total counts for pagination
    const [totalAdvertisers, totalCampaigns, totalZones] = await Promise.all([
      entityType === '' || entityType === 'advertiser' 
        ? LocalAdvertiser.countDocuments(baseQuery)
        : 0,
      entityType === '' || entityType === 'campaign'
        ? LocalCampaign.countDocuments(baseQuery)
        : 0,
      entityType === '' || entityType === 'zone'
        ? LocalZone.countDocuments(baseQuery)
        : 0
    ]);

    const totalCount = totalAdvertisers + totalCampaigns + totalZones;

    // Get summary statistics
    const summary = {
      total_synced: totalCount,
      by_type: {
        advertisers: totalAdvertisers,
        campaigns: totalCampaigns,
        zones: totalZones
      },
      recent_syncs: allEntities.slice(0, 5).map(entity => ({
        name: entity.name,
        type: entity.type,
        synced_at: entity.synced_at,
        broadstreet_id: entity.broadstreet_id
      }))
    };

    return NextResponse.json({
      success: true,
      entities: allEntities,
      summary,
      pagination: {
        total: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Audit API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
