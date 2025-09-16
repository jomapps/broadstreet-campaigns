import {
  Network,
  Advertiser,
  Zone,
  Campaign,
  Advertisement,
  Placement,
  NetworksResponse,
  AdvertisersResponse,
  ZonesResponse,
  CampaignsResponse,
  AdvertisementsResponse,
  PlacementsResponse,
} from './types/broadstreet';
import { mapApiIds } from './types/mapApiIds';

const API_BASE_URL = process.env.BROADSTREET_API_BASE_URL || 'https://api.broadstreetads.com/api/1';
const API_TOKEN = process.env.BROADSTREET_API_TOKEN || '';

// Configuration validation removed for production

class BroadstreetAPI {
  private baseURL: string;
  private token: string;

  constructor() {
    this.baseURL = API_BASE_URL || 'https://api.broadstreetads.com/api/1';
    this.token = API_TOKEN || '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}${endpoint.includes('?') ? '&' : '?'}access_token=${this.token}`;

    console.log('[request] Making API call:', {
      method: options.method || 'GET',
      url: url.replace(this.token, '***'),
      body: options.body
    });

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const status = response.status;
    const statusText = response.statusText;
    const responseText = await response.text();

    console.log('[request] API response:', {
      status,
      statusText,
      responseText: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
      headers: Object.fromEntries(response.headers.entries())
    });

    // Try to parse JSON safely
    let json: any = undefined;
    try {
      json = responseText ? JSON.parse(responseText) : undefined;
    } catch (parseError) {
      console.error('[request] JSON parse error:', parseError);
      json = undefined;
    }

    if (!response.ok) {
      const error: any = new Error(`API request failed: ${status} ${statusText}`);
      error.status = status;
      error.statusText = statusText;
      error.endpoint = endpoint;
      error.responseText = responseText;
      throw error;
    }

    return json as T;
  }

  // Networks
  async getNetworks(): Promise<Network[]> {
    const response = await this.request<NetworksResponse>('/networks');
    // Map legacy id -> broadstreet_id but keep legacy id for compatibility
    return response.networks.map((n: any) => mapApiIds(n, { stripId: false })) as unknown as Network[];
  }

  async getNetwork(id: number): Promise<Network> {
    const response = await this.request<{ network: any }>(`/networks/${id}`);
    return mapApiIds(response.network, { stripId: false }) as unknown as Network;
  }

  async createNetwork(network: {
    name: string;
    group_id?: number;
    web_home_url?: string;
    logo?: { url: string };
    valet_active?: boolean;
    path?: string;
    notes?: string;
  }): Promise<Network> {
    const response = await this.request<{ network: any }>('/networks', {
      method: 'POST',
      body: JSON.stringify(network),
    });
    return mapApiIds(response.network, { stripId: false }) as unknown as Network;
  }

  // Advertisers
  async getAdvertisers(networkId: number): Promise<Advertiser[]> {
    const response = await this.request<AdvertisersResponse>(`/advertisers?network_id=${networkId}`);
    return response.advertisers.map((a: any) => mapApiIds(a, { stripId: false })) as unknown as Advertiser[];
  }

  async getAdvertiser(id: number): Promise<Advertiser> {
    const response = await this.request<{ advertiser: any }>(`/advertisers/${id}`);
    return mapApiIds(response.advertiser, { stripId: false }) as unknown as Advertiser;
  }

  async updateAdvertiser(id: number, advertiser: {
    name?: string;
    web_home_url?: string;
    notes?: string;
  }): Promise<Advertiser> {
    const body: any = {};
    if (typeof advertiser.name === 'string' && advertiser.name.trim()) body.name = advertiser.name.trim();
    if (typeof advertiser.web_home_url === 'string' && advertiser.web_home_url.trim()) body.web_home_url = advertiser.web_home_url.trim();
    if (typeof advertiser.notes === 'string') body.notes = advertiser.notes.trim();

    const response = await this.request<{ advertiser: any }>(`/advertisers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return mapApiIds(response.advertiser, { stripId: false }) as unknown as Advertiser;
  }

  async createAdvertiser(advertiser: {
    name: string;
    network_id: number;
    logo?: { url: string };
    web_home_url?: string;
    notes?: string;
    admins?: Array<{ name: string; email: string }>;
  }): Promise<Advertiser> {
    // Per API spec, network_id must be sent as a query parameter; body includes only allowed fields
    const { network_id, name, web_home_url, notes } = advertiser;
    const endpoint = `/advertisers?network_id=${encodeURIComponent(network_id)}`;
    const body: any = { name };
    if (web_home_url) body.web_home_url = web_home_url;
    if (typeof notes === 'string' && notes.trim()) body.notes = notes.trim();

    const response = await this.request<{ advertiser: any }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapApiIds(response.advertiser, { stripId: false }) as unknown as Advertiser;
  }

  // Zones
  async getZones(networkId: number): Promise<Zone[]> {
    const response = await this.request<ZonesResponse>(`/zones?network_id=${networkId}`);
    return response.zones.map((z: any) => mapApiIds(z, { stripId: false })) as unknown as Zone[];
  }

  async getZone(id: number): Promise<Zone> {
    const response = await this.request<{ zone: any }>(`/zones/${id}`);
    return mapApiIds(response.zone, { stripId: false }) as unknown as Zone;
  }

  async createZone(zone: {
    name: string;
    network_id: number;
    alias?: string;
    self_serve?: boolean;
    advertisement_count?: number;
    allow_duplicate_ads?: boolean;
    concurrent_campaigns?: number;
    advertisement_label?: string;
    archived?: boolean;
    display_type?: string;
    rotation_interval?: number;
    animation_type?: string;
    width?: number;
    height?: number;
    rss_shuffle?: boolean;
    style?: string;
  }): Promise<Zone> {
    const response = await this.request<{ zone: any }>('/zones', {
      method: 'POST',
      body: JSON.stringify(zone),
    });
    return mapApiIds(response.zone, { stripId: false }) as unknown as Zone;
  }

  // Campaigns
  async getCampaignsByAdvertiser(advertiserId: number): Promise<Campaign[]> {
    const response = await this.request<CampaignsResponse>(`/campaigns?advertiser_id=${advertiserId}`);
    return response.campaigns.map((c: any) => mapApiIds(c, { stripId: false })) as unknown as Campaign[];
  }

  async getCampaignsByZone(zoneId: number): Promise<Campaign[]> {
    const response = await this.request<CampaignsResponse>(`/campaigns?zone_id=${zoneId}`);
    return response.campaigns.map((c: any) => mapApiIds(c, { stripId: false })) as unknown as Campaign[];
  }

  async getCampaign(id: number): Promise<Campaign> {
    const response = await this.request<{ campaign: any }>(`/campaigns/${id}`);
    return mapApiIds(response.campaign, { stripId: false }) as unknown as Campaign;
  }

  async createCampaign(campaign: {
    name: string;
    advertiser_id: number;
    start_date?: string;
    end_date?: string;
    max_impression_count?: number;
    display_type?: string;
    active?: boolean;
    weight?: number;
    path?: string;
    archived?: boolean;
    pacing_type?: string;
    impression_max_type?: string;
    paused?: boolean;
    notes?: string;
  }): Promise<Campaign> {
    const response = await this.request<{ campaign: any }>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaign),
    });
    return mapApiIds(response.campaign, { stripId: false }) as unknown as Campaign;
  }

  // Advertisements
  async getAdvertisements(params: {
    networkId: number;
    zoneId?: number;
    advertiserId?: number;
  }): Promise<Advertisement[]> {
    let query = `network_id=${params.networkId}`;
    if (params.zoneId) query += `&zone_id=${params.zoneId}`;
    if (params.advertiserId) query += `&advertiser_id=${params.advertiserId}`;
    
    const response = await this.request<AdvertisementsResponse>(`/advertisements?${query}`);
    return response.advertisements.map((a: any) => mapApiIds(a, { stripId: false })) as unknown as Advertisement[];
  }

  async createAdvertisement(advertisement: {
    name: string;
    network_id: number;
    type: string;
    advertiser?: string;
    advertiser_id?: number;
    active?: { url?: string | null };
    active_placement?: boolean;
    preview_url?: string;
    notes?: string;
  }): Promise<Advertisement> {
    const response = await this.request<{ advertisement: any }>('/advertisements', {
      method: 'POST',
      body: JSON.stringify(advertisement),
    });
    return mapApiIds(response.advertisement, { stripId: false }) as unknown as Advertisement;
  }

  // Placements
  async getPlacements(campaignId: number): Promise<any[]> {
    const response = await this.request<any[]>(`/placements?campaign_id=${campaignId}`);
    
    // API returns array of placement objects directly
    // Normalize field names to internal schema (advertisement_id, zone_id)
    if (Array.isArray(response)) {
      return response.map((placement: any) => ({
        advertisement_id: placement.advertisement_id,
        zone_id: placement.zone_id,
        campaign_id: campaignId,
        restrictions: placement.restrictions || [],
      }));
    }
    
    // If not an array, return empty array
    return [];
  }

  async createPlacement(placement: {
    campaign_id: number;
    advertisement_id: number;
    zone_id: number;
    restrictions?: string[];
  }): Promise<Placement> {
    const response = await this.request<PlacementsResponse>('/placements', {
      method: 'POST',
      body: JSON.stringify(placement),
    });

    // Handle Broadstreet API behavior: 201 Created with empty response body
    // This means the placement was created successfully, but no data is returned
    if (response === undefined || response === null) {
      // Return the placement data based on the request since API doesn't return it
      return {
        advertisement_id: placement.advertisement_id,
        zone_id: placement.zone_id,
        campaign_id: placement.campaign_id,
        restrictions: placement.restrictions || [],
      } as unknown as Placement;
    }

    // Handle normal response with placement data
    let placementData: any;
    if (response && typeof response === 'object') {
      // Try different possible response structures
      placementData = response.placement || response.data || response;
    } else {
      throw new Error(`Invalid API response structure: ${typeof response}`);
    }

    return {
      advertisement_id: placementData.advertisement_id || placement.advertisement_id,
      zone_id: placementData.zone_id || placement.zone_id,
      campaign_id: placement.campaign_id,
      restrictions: placementData.restrictions || placement.restrictions || [],
    } as unknown as Placement;
  }

  async deletePlacement(params: {
    campaign_id: number;
    advertisement_id: number;
    zone_id: number;
  }): Promise<void> {
    const query = `campaign_id=${params.campaign_id}&advertisement_id=${params.advertisement_id}&zone_id=${params.zone_id}`;
    await this.request(`/placements?${query}`, {
      method: 'DELETE',
    });
  }

  // Dry run validation methods for checking existing entities
  async checkExistingAdvertiser(name: string, networkId: number): Promise<boolean> {
    try {
      const response = await this.request<{ advertisers: Advertiser[] }>(`/advertisers?network_id=${networkId}`);
      return response.advertisers.some(advertiser => 
        advertiser.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
    } catch (error) {
      return false; // Assume no conflict if we can't check
    }
  }

  /**
   * Find an existing advertiser by name for a given network. Returns the remote advertiser or null.
   */
  async findAdvertiserByName(networkId: number, name: string): Promise<Advertiser | null> {
    try {
      const response = await this.request<{ advertisers: Advertiser[] }>(`/advertisers?network_id=${networkId}`);
      const normalized = name.toLowerCase().trim();
      const match = response.advertisers.find(a => a.name.toLowerCase().trim() === normalized);
      return match || null;
    } catch (error) {
      return null;
    }
  }

  async checkExistingCampaign(name: string, advertiserId: number): Promise<boolean> {
    try {
      const response = await this.request<{ campaigns: Campaign[] }>(`/campaigns?advertiser_id=${advertiserId}`);
      return response.campaigns.some(campaign => 
        campaign.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
    } catch (error) {
      return false; // Assume no conflict if we can't check
    }
  }

  async findCampaignByName(advertiserId: number, name: string): Promise<Campaign | null> {
    try {
      const response = await this.request<{ campaigns: Campaign[] }>(`/campaigns?advertiser_id=${advertiserId}`);
      const normalized = name.toLowerCase().trim();
      const match = response.campaigns.find(c => c.name.toLowerCase().trim() === normalized);
      return match || null;
    } catch (error) {
      return null;
    }
  }

  async checkExistingZone(name: string, networkId: number): Promise<boolean> {
    try {
      const response = await this.request<{ zones: Zone[] }>(`/zones?network_id=${networkId}`);
      return response.zones.some(zone => 
        zone.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
    } catch (error) {
      return false; // Assume no conflict if we can't check
    }
  }

  async checkExistingAdvertisement(name: string, networkId: number): Promise<boolean> {
    try {
      const response = await this.request<{ advertisements: Advertisement[] }>(`/advertisements?network_id=${networkId}`);
      return response.advertisements.some(advertisement => 
        advertisement.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
    } catch (error) {
      return false; // Assume no conflict if we can't check
    }
  }
}

export const broadstreetAPI = new BroadstreetAPI();
export default broadstreetAPI;
