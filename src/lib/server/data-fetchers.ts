/**
 * SERVER DATA FETCHERS - SERVER-SIDE DATA FETCHING UTILITIES
 * 
 * This file provides server-side data fetching utilities for Next.js pages.
 * Follows the PayloadCMS Local API pattern with proper error handling.
 * All variable names follow docs/variable-origins.md registry.
 * 
 * CRITICAL RULES:
 * 1. All variable names from docs/variable-origins.md registry
 * 2. All functions are server-side only (no client usage)
 * 3. Proper error handling and logging
 * 4. Entity serialization for client transfer
 * 5. No TypeScript types - using plain JavaScript with JSDoc
 */

import connectDB from '@/lib/mongodb';
import Network from '@/lib/models/network';
import Advertiser from '@/lib/models/advertiser';
import Zone from '@/lib/models/zone';
import Campaign from '@/lib/models/campaign';
import Advertisement from '@/lib/models/advertisement';
import LocalZone from '@/lib/models/local-zone';
import LocalAdvertiser from '@/lib/models/local-advertiser';
import LocalCampaign from '@/lib/models/local-campaign';
import LocalNetwork from '@/lib/models/local-network';
import LocalAdvertisement from '@/lib/models/local-advertisement';
import Placement from '@/lib/models/placement';
import Theme from '@/lib/models/theme';

/**
 * Deep serialize entity for client transfer
 * Recursively converts MongoDB ObjectIds to strings and dates to ISO strings
 * Handles nested objects and arrays to prevent Next.js serialization warnings
 * @param {any} entity - Entity to serialize
 * @returns {any} Serialized entity safe for client transfer
 */
function serializeEntity(entity: any): any {
  if (!entity) return null;

  // Handle primitive types
  if (typeof entity !== 'object') return entity;

  // Handle Date objects
  if (entity instanceof Date) {
    return entity.toISOString();
  }

  // Handle MongoDB ObjectId (has toString method and _bsontype)
  if (entity._bsontype === 'ObjectId' || (entity.toString && typeof entity.toString === 'function' && entity.constructor?.name === 'ObjectId')) {
    return entity.toString();
  }

  // Handle arrays
  if (Array.isArray(entity)) {
    return entity.map(serializeEntity);
  }

  // Handle plain objects
  const serialized: any = {};
  for (const [key, value] of Object.entries(entity)) {
    serialized[key] = serializeEntity(value);
  }

  return serialized;
}

/**
 * Serialize array of entities for client transfer
 * @param {any[]} entities - Array of entities to serialize
 * @returns {any[]} Array of serialized entities
 */
function serializeEntities(entities: any[]): any[] {
  if (!Array.isArray(entities)) return [];
  return entities.map(serializeEntity);
}

// =============================================================================
// SYNCED ENTITY FETCHERS
// =============================================================================

/**
 * Fetch networks from database
 * Variable names follow docs/variable-origins.md registry
 * @param {Object} params - Optional query parameters
 * @returns {Promise<any[]>} Array of network entities
 */
export async function fetchNetworks(params: any = {}) {
  try {
    await connectDB();
    
    // Build query based on parameters
    const query: any = {};
    
    // Add search filter if provided
    if (params.search) {
      query.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { path: { $regex: params.search, $options: 'i' } },
      ];
    }
    
    // Build sort options
    const sortOptions: any = {};
    if (params.sort) {
      const order = params.order === 'desc' ? -1 : 1;
      sortOptions[params.sort] = order;
    } else {
      sortOptions.name = 1; // Default sort by name ascending
    }
    
    const networks = await Network.find(query)
      .sort(sortOptions)
      .lean();
    
    return serializeEntities(networks);
  } catch (error) {
    console.error('Error fetching networks:', error);
    throw new Error('Failed to fetch networks');
  }
}

/**
 * Fetch advertisers from database
 * Variable names follow docs/variable-origins.md registry
 * @param {number} networkId - Optional network ID filter
 * @param {Object} params - Optional query parameters
 * @returns {Promise<any[]>} Array of advertiser entities
 */
export async function fetchAdvertisers(networkId: any, params: any = {}) {
  try {
    await connectDB();

    // Build query based on parameters
    const query: any = {};
    
    // Add network filter if provided
    if (networkId) {
      query.network_id = networkId;
    }
    
    // Add search filter if provided
    if (params.search) {
      query.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { web_home_url: { $regex: params.search, $options: 'i' } },
      ];
    }
    
    // Add status filter if provided
    if (params.status) {
      if (params.status === 'synced') {
        query.broadstreet_id = { $exists: true };
      } else if (params.status === 'local') {
        query.broadstreet_id = { $exists: false };
      }
    }
    
    const advertisers = await Advertiser.find(query)
      .sort({ name: 1 })
      .lean();
    
    return serializeEntities(advertisers);
  } catch (error) {
    console.error('Error fetching advertisers:', error);
    throw new Error('Failed to fetch advertisers');
  }
}

/**
 * Fetch zones from database (both API and local zones)
 * Variable names follow docs/variable-origins.md registry
 * @param {number} networkId - Optional network ID filter
 * @param {Object} params - Optional query parameters
 * @returns {Promise<any[]>} Array of zone entities with source information
 */
export async function fetchZones(networkId: any, params: any = {}) {
  try {
    await connectDB();

    // Build query based on parameters
    const query: any = {};

    // Add network filter if provided
    if (networkId) {
      query.network_id = networkId;
    }

    // Add search filter if provided
    if (params.search) {
      query.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { alias: { $regex: params.search, $options: 'i' } },
      ];
    }

    // Fetch zones from both models in parallel
    const [apiZones, localZones] = await Promise.all([
      Zone.find(query).sort({ name: 1 }).lean(),
      // Show only truly local, not-yet-synced zones
      LocalZone.find({ ...query, synced_with_api: false }).sort({ name: 1 }).lean()
    ]);

    // Combine zones from both sources with source information
    const allZones = [
      ...apiZones.map(zone => ({ ...zone, source: 'api' })),
      ...localZones.map(zone => ({ ...zone, source: 'local', broadstreet_id: undefined }))
    ];

    return serializeEntities(allZones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    throw new Error('Failed to fetch zones');
  }
}

/**
 * Fetch campaigns from database
 * Variable names follow docs/variable-origins.md registry
 * @param {number} advertiserId - Optional advertiser ID filter
 * @param {Object} params - Optional query parameters
 * @returns {Promise<any[]>} Array of campaign entities
 */
export async function fetchCampaigns(advertiserId: any, params: any = {}) {
  try {
    await connectDB();

    // Build query based on parameters
    const query: any = {};

    // Add advertiser filter if provided
    if (advertiserId) {
      query.advertiser_id = advertiserId;
    }

    // Add network filter if provided
    if (params.networkId) {
      query.network_id = params.networkId;
    }
    
    // Add search filter if provided
    if (params.search) {
      query.$or = [
        { name: { $regex: params.search, $options: 'i' } },
      ];
    }
    
    // Add status filter if provided
    if (params.status) {
      if (params.status === 'active') {
        const now = new Date();
        query.$and = [
          { $or: [{ start_date: { $exists: false } }, { start_date: { $lte: now } }] },
          { $or: [{ end_date: { $exists: false } }, { end_date: { $gte: now } }] },
        ];
      } else if (params.status === 'ended') {
        query.end_date = { $lt: new Date() };
      } else if (params.status === 'scheduled') {
        query.start_date = { $gt: new Date() };
      }
    }
    
    const campaigns = await Campaign.find(query)
      .sort({ name: 1 })
      .lean();
    
    return serializeEntities(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw new Error('Failed to fetch campaigns');
  }
}

/**
 * Fetch advertisements from database
 * Variable names follow docs/variable-origins.md registry
 * @param {number} advertiserId - Optional advertiser ID filter
 * @param {Object} params - Optional query parameters
 * @returns {Promise<any[]>} Array of advertisement entities
 */
export async function fetchAdvertisements(advertiserId: any, params: any = {}) {
  try {
    await connectDB();

    // Build query based on parameters
    const query: any = {};

    // Add advertiser filter if provided
    if (advertiserId) {
      query.advertiser_id = advertiserId;
    }

    // Add network filter if provided
    if (params.networkId) {
      query.network_id = params.networkId;
    }
    
    // Add search filter if provided
    if (params.search) {
      query.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { type: { $regex: params.search, $options: 'i' } },
      ];
    }
    
    // Add type filter if provided
    if (params.type) {
      query.type = params.type;
    }
    
    const advertisements = await Advertisement.find(query)
      .sort({ name: 1 })
      .lean();
    
    return serializeEntities(advertisements);
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    throw new Error('Failed to fetch advertisements');
  }
}

// =============================================================================
// LOCAL ENTITY FETCHERS
// =============================================================================

/**
 * Fetch all local entities from database
 * Variable names follow docs/variable-origins.md registry
 * @returns {Promise<Object>} Object containing all local entity collections
 */
export async function fetchLocalEntities() {
  try {
    await connectDB();
    
    // Fetch all local entity types in parallel
    const [localZones, localAdvertisers, localCampaigns, localNetworks, localAdvertisements, localPlacements] = await Promise.all([
      LocalZone.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
      LocalAdvertiser.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
      LocalCampaign.find({ 
        $or: [
          { synced_with_api: false }, 
          { 'placements.0': { $exists: true } }
        ] 
      }).sort({ created_at: -1 }).lean(),
      LocalNetwork.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
      LocalAdvertisement.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
      Placement.find({ 
        created_locally: true, 
        synced_with_api: false 
      }).sort({ created_at: -1 }).lean(),
    ]);
    
    return {
      zones: serializeEntities(localZones),
      advertisers: serializeEntities(localAdvertisers),
      campaigns: serializeEntities(localCampaigns),
      networks: serializeEntities(localNetworks),
      advertisements: serializeEntities(localAdvertisements),
      placements: serializeEntities(localPlacements),
    };
  } catch (error) {
    console.error('Error fetching local entities:', error);
    throw new Error('Failed to fetch local entities');
  }
}

/**
 * Fetch placements from database with optional filtering
 * Variable names follow docs/variable-origins.md registry
 * @param {number} networkId - Optional network ID filter
 * @param {number} advertiserId - Optional advertiser ID filter
 * @param {number} campaignId - Optional campaign ID filter
 * @param {Object} params - Optional query parameters
 * @returns {Promise<any[]>} Array of placement entities
 */
export async function fetchPlacements(networkId: any, advertiserId: any, campaignId: any, params: any = {}) {
  try {
    await connectDB();

    // Build query based on parameters
    const query: any = {};

    // Add network filter if provided
    if (networkId) {
      query.network_id = networkId;
    }

    // Add advertiser filter if provided
    if (advertiserId) {
      query.advertiser_id = advertiserId;
    }

    // Add campaign filter if provided
    if (campaignId) {
      query.$or = [
        { campaign_id: campaignId },
        { campaign_mongo_id: campaignId },
      ];
    }
    
    // Add zone filter if provided
    if (params.zoneId) {
      query.$or = [
        { zone_id: params.zoneId },
        { zone_mongo_id: params.zoneId },
      ];
    }
    
    // Add date range filter if provided
    if (params.startDate || params.endDate) {
      query.created_at = {};
      if (params.startDate) {
        query.created_at.$gte = new Date(params.startDate);
      }
      if (params.endDate) {
        query.created_at.$lte = new Date(params.endDate);
      }
    }
    
    // Add status filter if provided
    if (params.status) {
      if (params.status === 'local') {
        query.created_locally = true;
        query.synced_with_api = false;
      } else if (params.status === 'synced') {
        query.synced_with_api = true;
      }
    }
    
    const placements = await Placement.find(query)
      .sort({ created_at: -1 })
      .lean();
    
    return serializeEntities(placements);
  } catch (error) {
    console.error('Error fetching placements:', error);
    throw new Error('Failed to fetch placements');
  }
}

/**
 * Fetch themes from database
 * Variable names follow docs/variable-origins.md registry
 * @param {Object} params - Optional query parameters
 * @returns {Promise<any[]>} Array of theme entities
 */
export async function fetchThemes(params: any = {}) {
  try {
    await connectDB();

    // Build query based on parameters
    const query: any = {};

    // Add search filter if provided
    if (params.search) {
      query.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { description: { $regex: params.search, $options: 'i' } },
      ];
    }

    const themes = await Theme.find(query)
      .sort({ name: 1 })
      .lean({ virtuals: true });

    return serializeEntities(themes);
  } catch (error) {
    console.error('Error fetching themes:', error);
    throw new Error('Failed to fetch themes');
  }
}

/**
 * Fetch single theme by ID with zones
 * Variable names follow docs/variable-origins.md registry
 * @param {string} themeId - Theme ID to fetch
 * @returns {Promise<any|null>} Theme entity with zones or null if not found
 */
export async function fetchThemeById(themeId: any) {
  try {
    await connectDB();

    const theme = await Theme.findById(themeId).lean({ virtuals: true });

    if (!theme) {
      return null;
    }

    // Fetch zones that belong to this theme
    const zones = await Zone.find({
      broadstreet_id: { $in: (theme as any).zone_ids || [] }
    }).sort({ name: 1 }).lean();

    return {
      ...serializeEntity(theme),
      zones: serializeEntities(zones)
    };
  } catch (error) {
    console.error('Error fetching theme by ID:', error);
    throw new Error('Failed to fetch theme');
  }
}

/**
 * Fetch audit data with search, filtering, and pagination
 * Variable names follow docs/variable-origins.md registry
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Audit data with entities, summary, and pagination
 */
export async function fetchAuditData(params: any = {}) {
  try {
    await connectDB();

    const {
      search = '',
      type = '',
      limit = '50',
      offset = '0'
    } = params;

    const limitNum = parseInt(limit, 10) || 50;
    const offsetNum = parseInt(offset, 10) || 0;

    // Build query for audit entities (synced entities from all collections)
    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } }
      ]
    } : {};

    // Fetch entities from different collections based on type filter
    const entities: any[] = [];
    const summary: any = {
      total_synced: 0,
      by_type: {
        advertisers: 0,
        campaigns: 0,
        zones: 0,
      },
      recent_syncs: []
    };

    if (!type || type === 'advertiser') {
      const advertisers = await Advertiser.find({
        ...searchQuery,
        broadstreet_id: { $exists: true }
      }).sort({ synced_at: -1 }).lean();

      entities.push(...advertisers.map(a => ({
        ...a,
        type: 'advertiser',
        entity_id: (a._id as any).toString()
      })));
      summary.by_type.advertisers = advertisers.length;
    }

    if (!type || type === 'campaign') {
      const campaigns = await Campaign.find({
        ...searchQuery,
        broadstreet_id: { $exists: true }
      }).sort({ synced_at: -1 }).lean();

      entities.push(...campaigns.map(c => ({
        ...c,
        type: 'campaign',
        entity_id: (c._id as any).toString()
      })));
      summary.by_type.campaigns = campaigns.length;
    }

    if (!type || type === 'zone') {
      const zones = await Zone.find({
        ...searchQuery,
        broadstreet_id: { $exists: true }
      }).sort({ synced_at: -1 }).lean();

      entities.push(...zones.map(z => ({
        ...z,
        type: 'zone',
        entity_id: (z._id as any).toString()
      })));
      summary.by_type.zones = zones.length;
    }

    // Sort all entities by synced_at descending
    entities.sort((a, b) => new Date((b as any).synced_at).getTime() - new Date((a as any).synced_at).getTime());

    // Calculate totals
    summary.total_synced = entities.length;
    summary.recent_syncs = entities.slice(0, 5).map(e => ({
      name: e.name,
      type: e.type,
      synced_at: e.synced_at,
      broadstreet_id: e.broadstreet_id
    }));

    // Apply pagination
    const paginatedEntities = entities.slice(offsetNum, offsetNum + limitNum);

    return {
      success: true,
      entities: serializeEntities(paginatedEntities),
      summary,
      pagination: {
        total: entities.length,
        limit: limitNum,
        offset: offsetNum,
        has_more: offsetNum + limitNum < entities.length
      }
    };
  } catch (error) {
    console.error('Error fetching audit data:', error);
    throw new Error('Failed to fetch audit data');
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get entity counts for dashboard summary
 * Variable names follow docs/variable-origins.md registry
 * @param {number} networkId - Optional network ID filter
 * @returns {Promise<Object>} Object containing entity counts
 */
export async function getEntityCounts(networkId: any) {
  try {
    await connectDB();

    const query = networkId ? { network_id: networkId } : {};

    // Count embedded placements from campaigns (this is where sync stores them)
    const placementCountResult = await Campaign.aggregate([
      { $match: query },
      { $project: { placementCount: { $size: { $ifNull: ['$placements', []] } } } },
      { $group: { _id: null, totalPlacements: { $sum: '$placementCount' } } }
    ]);
    const embeddedPlacementCount = placementCountResult.length > 0 ? placementCountResult[0].totalPlacements : 0;

    const [
      networkCount,
      advertiserCount,
      campaignCount,
      zoneCount,
      advertisementCount,
      localPlacementCount,
      localEntityCounts
    ] = await Promise.all([
      networkId ? 1 : Network.countDocuments({}),
      Advertiser.countDocuments(query),
      Campaign.countDocuments(query),
      Zone.countDocuments(query),
      Advertisement.countDocuments(query),
      // Count local placements from the Placement collection (local-only placements)
      Placement.countDocuments({ ...query, created_locally: true, synced_with_api: false }),
      Promise.all([
        LocalZone.countDocuments({ ...query, synced_with_api: false }),
        LocalAdvertiser.countDocuments({ ...query, synced_with_api: false }),
        LocalCampaign.countDocuments({ ...query, synced_with_api: false }),
        LocalNetwork.countDocuments({ synced_with_api: false }),
        LocalAdvertisement.countDocuments({ ...query, synced_with_api: false }),
      ]),
    ]);

    const [localZoneCount, localAdvertiserCount, localCampaignCount, localNetworkCount, localAdvertisementCount] = localEntityCounts;

    return {
      networks: networkCount,
      advertisers: advertiserCount,
      campaigns: campaignCount,
      zones: zoneCount,
      advertisements: advertisementCount,
      placements: embeddedPlacementCount, // Use embedded placement count from campaigns
      localZones: localZoneCount,
      localAdvertisers: localAdvertiserCount,
      localCampaigns: localCampaignCount,
      localNetworks: localNetworkCount,
      localAdvertisements: localAdvertisementCount,
      localPlacements: localPlacementCount, // Local-only placements from Placement collection
      totalLocal: localZoneCount + localAdvertiserCount + localCampaignCount + localNetworkCount + localAdvertisementCount + localPlacementCount,
    };
  } catch (error) {
    console.error('Error getting entity counts:', error);
    throw new Error('Failed to get entity counts');
  }
}
