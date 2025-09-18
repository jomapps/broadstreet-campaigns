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

/**
 * Serialize entity for client transfer
 * Converts MongoDB ObjectIds to strings and dates to ISO strings
 * @param {any} entity - Entity to serialize
 * @returns {any} Serialized entity
 */
function serializeEntity(entity) {
  if (!entity) return null;
  
  return {
    ...entity,
    _id: entity._id?.toString(),
    mongo_id: entity.mongo_id?.toString(),
    created_at: entity.created_at?.toISOString(),
    updated_at: entity.updated_at?.toISOString(),
    synced_at: entity.synced_at?.toISOString(),
    createdAt: entity.createdAt?.toISOString(),
    updatedAt: entity.updatedAt?.toISOString(),
  };
}

/**
 * Serialize array of entities for client transfer
 * @param {any[]} entities - Array of entities to serialize
 * @returns {any[]} Array of serialized entities
 */
function serializeEntities(entities) {
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
export async function fetchNetworks(params = {}) {
  try {
    await connectDB();
    
    // Build query based on parameters
    const query = {};
    
    // Add search filter if provided
    if (params.search) {
      query.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { path: { $regex: params.search, $options: 'i' } },
      ];
    }
    
    // Build sort options
    const sortOptions = {};
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
export async function fetchAdvertisers(networkId, params = {}) {
  try {
    await connectDB();
    
    // Build query based on parameters
    const query = {};
    
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
 * Fetch zones from database
 * Variable names follow docs/variable-origins.md registry
 * @param {number} networkId - Optional network ID filter
 * @param {Object} params - Optional query parameters
 * @returns {Promise<any[]>} Array of zone entities
 */
export async function fetchZones(networkId, params = {}) {
  try {
    await connectDB();
    
    // Build query based on parameters
    const query = {};
    
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
    
    const zones = await Zone.find(query)
      .sort({ name: 1 })
      .lean();
    
    return serializeEntities(zones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    throw new Error('Failed to fetch zones');
  }
}

/**
 * Fetch campaigns from database
 * Variable names follow docs/variable-origins.md registry
 * @param {Object} params - Query parameters
 * @returns {Promise<any[]>} Array of campaign entities
 */
export async function fetchCampaigns(params = {}) {
  try {
    await connectDB();
    
    // Build query based on parameters
    const query = {};
    
    // Add network filter if provided
    if (params.networkId) {
      query.network_id = params.networkId;
    }
    
    // Add advertiser filter if provided
    if (params.advertiserId) {
      query.advertiser_id = params.advertiserId;
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
 * @param {number} networkId - Optional network ID filter
 * @param {Object} params - Optional query parameters
 * @returns {Promise<any[]>} Array of advertisement entities
 */
export async function fetchAdvertisements(networkId, params = {}) {
  try {
    await connectDB();
    
    // Build query based on parameters
    const query = {};
    
    // Add network filter if provided
    if (networkId) {
      query.network_id = networkId;
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
 * @param {Object} params - Query parameters
 * @returns {Promise<any[]>} Array of placement entities
 */
export async function fetchPlacements(params = {}) {
  try {
    await connectDB();
    
    // Build query based on parameters
    const query = {};
    
    // Add network filter if provided
    if (params.networkId) {
      query.network_id = params.networkId;
    }
    
    // Add advertiser filter if provided
    if (params.advertiserId) {
      query.advertiser_id = params.advertiserId;
    }
    
    // Add campaign filter if provided
    if (params.campaignId) {
      query.$or = [
        { campaign_id: params.campaignId },
        { campaign_mongo_id: params.campaignId },
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

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get entity counts for dashboard summary
 * Variable names follow docs/variable-origins.md registry
 * @param {number} networkId - Optional network ID filter
 * @returns {Promise<Object>} Object containing entity counts
 */
export async function getEntityCounts(networkId) {
  try {
    await connectDB();
    
    const query = networkId ? { network_id: networkId } : {};
    
    const [
      networkCount,
      advertiserCount,
      campaignCount,
      zoneCount,
      advertisementCount,
      placementCount,
      localEntityCounts
    ] = await Promise.all([
      networkId ? 1 : Network.countDocuments({}),
      Advertiser.countDocuments(query),
      Campaign.countDocuments(query),
      Zone.countDocuments(query),
      Advertisement.countDocuments(query),
      Placement.countDocuments(query),
      Promise.all([
        LocalZone.countDocuments({ ...query, synced_with_api: false }),
        LocalAdvertiser.countDocuments({ ...query, synced_with_api: false }),
        LocalCampaign.countDocuments({ ...query, synced_with_api: false }),
        LocalNetwork.countDocuments({ synced_with_api: false }),
        LocalAdvertisement.countDocuments({ ...query, synced_with_api: false }),
        Placement.countDocuments({ ...query, created_locally: true, synced_with_api: false }),
      ]),
    ]);
    
    const [localZoneCount, localAdvertiserCount, localCampaignCount, localNetworkCount, localAdvertisementCount, localPlacementCount] = localEntityCounts;
    
    return {
      networks: networkCount,
      advertisers: advertiserCount,
      campaigns: campaignCount,
      zones: zoneCount,
      advertisements: advertisementCount,
      placements: placementCount,
      localZones: localZoneCount,
      localAdvertisers: localAdvertiserCount,
      localCampaigns: localCampaignCount,
      localNetworks: localNetworkCount,
      localAdvertisements: localAdvertisementCount,
      localPlacements: localPlacementCount,
      totalLocal: localZoneCount + localAdvertiserCount + localCampaignCount + localNetworkCount + localAdvertisementCount + localPlacementCount,
    };
  } catch (error) {
    console.error('Error getting entity counts:', error);
    throw new Error('Failed to get entity counts');
  }
}
