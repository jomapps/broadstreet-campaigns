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

const API_BASE_URL = process.env.BROADSTREET_API_BASE_URL || 'https://api.broadstreetads.com/api/1';
const API_TOKEN = process.env.BROADSTREET_API_TOKEN || '';

// Only warn in runtime, not during build
if (typeof window !== 'undefined' && (!API_BASE_URL || !API_TOKEN)) {
  console.warn('Missing Broadstreet API configuration. API calls will fail.');
}

class BroadstreetAPI {
  private baseURL: string;
  private token: string;

  constructor() {
    this.baseURL = API_BASE_URL || 'https://api.broadstreetads.com/api/1';
    this.token = API_TOKEN || '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}${endpoint.includes('?') ? '&' : '?'}access_token=${this.token}`;
    const sanitizedUrl = this.token ? url.replace(this.token, '***') : url;

    // Parse body for logging (if any)
    let parsedBody: any = undefined;
    try {
      if (options.body && typeof options.body === 'string') {
        parsedBody = JSON.parse(options.body as string);
      }
    } catch (_) {
      parsedBody = options.body;
    }

    const method = (options.method || 'GET').toUpperCase();
    console.log('[BroadstreetAPI] Request:', { method, endpoint, url: sanitizedUrl, body: parsedBody });

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

    // Try to parse JSON safely
    let json: any = undefined;
    try {
      json = responseText ? JSON.parse(responseText) : undefined;
    } catch (_) {
      json = undefined;
    }

    if (!response.ok) {
      console.error('[BroadstreetAPI] Response (error):', { method, endpoint, status, statusText, body: responseText?.slice(0, 1000) });
      throw new Error(`API request failed: ${status} ${statusText}`);
    }

    console.log('[BroadstreetAPI] Response (ok):', { method, endpoint, status, keys: json ? Object.keys(json) : undefined });
    return json as T;
  }

  // Networks
  async getNetworks(): Promise<Network[]> {
    const response = await this.request<NetworksResponse>('/networks');
    return response.networks;
  }

  async getNetwork(id: number): Promise<Network> {
    const response = await this.request<{ network: Network }>(`/networks/${id}`);
    return response.network;
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
    const response = await this.request<{ network: Network }>('/networks', {
      method: 'POST',
      body: JSON.stringify(network),
    });
    return response.network;
  }

  // Advertisers
  async getAdvertisers(networkId: number): Promise<Advertiser[]> {
    const response = await this.request<AdvertisersResponse>(`/advertisers?network_id=${networkId}`);
    return response.advertisers;
  }

  async getAdvertiser(id: number): Promise<Advertiser> {
    const response = await this.request<{ advertiser: Advertiser }>(`/advertisers/${id}`);
    return response.advertiser;
  }

  async createAdvertiser(advertiser: {
    name: string;
    network_id: number;
    logo?: { url: string };
    web_home_url?: string;
    notes?: string;
    admins?: Array<{ name: string; email: string }>;
  }): Promise<Advertiser> {
    const response = await this.request<{ advertiser: Advertiser }>('/advertisers', {
      method: 'POST',
      body: JSON.stringify(advertiser),
    });
    return response.advertiser;
  }

  // Zones
  async getZones(networkId: number): Promise<Zone[]> {
    const response = await this.request<ZonesResponse>(`/zones?network_id=${networkId}`);
    return response.zones;
  }

  async getZone(id: number): Promise<Zone> {
    const response = await this.request<{ zone: Zone }>(`/zones/${id}`);
    return response.zone;
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
    const response = await this.request<{ zone: Zone }>('/zones', {
      method: 'POST',
      body: JSON.stringify(zone),
    });
    return response.zone;
  }

  // Campaigns
  async getCampaignsByAdvertiser(advertiserId: number): Promise<Campaign[]> {
    const response = await this.request<CampaignsResponse>(`/campaigns?advertiser_id=${advertiserId}`);
    return response.campaigns;
  }

  async getCampaignsByZone(zoneId: number): Promise<Campaign[]> {
    const response = await this.request<CampaignsResponse>(`/campaigns?zone_id=${zoneId}`);
    return response.campaigns;
  }

  async getCampaign(id: number): Promise<Campaign> {
    const response = await this.request<{ campaign: Campaign }>(`/campaigns/${id}`);
    return response.campaign;
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
    const response = await this.request<{ campaign: Campaign }>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaign),
    });
    return response.campaign;
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
    return response.advertisements;
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
    const response = await this.request<{ advertisement: Advertisement }>('/advertisements', {
      method: 'POST',
      body: JSON.stringify(advertisement),
    });
    return response.advertisement;
  }

  // Placements
  async getPlacements(campaignId: number): Promise<Placement[]> {
    const response = await this.request<Placement[]>(`/placements?campaign_id=${campaignId}`);
    
    // API returns array of placement objects directly
    // Need to add campaign_id since it's not in the API response
    if (Array.isArray(response)) {
      return response.map(placement => ({
        ...placement,
        campaign_id: campaignId
      }));
    }
    
    // If not an array, return empty array
    return [];
  }

  async createPlacement(placement: {
    campaign_id: number;
    advertisement_id: number;
    zone_id: number;
    restrictions?: string;
  }): Promise<Placement> {
    const response = await this.request<PlacementsResponse>('/placements', {
      method: 'POST',
      body: JSON.stringify(placement),
    });
    return response.placement;
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
      console.error('Error checking existing advertiser:', error);
      return false; // Assume no conflict if we can't check
    }
  }

  async checkExistingCampaign(name: string, advertiserId: number): Promise<boolean> {
    try {
      const response = await this.request<{ campaigns: Campaign[] }>(`/campaigns?advertiser_id=${advertiserId}`);
      return response.campaigns.some(campaign => 
        campaign.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
    } catch (error) {
      console.error('Error checking existing campaign:', error);
      return false; // Assume no conflict if we can't check
    }
  }

  async checkExistingZone(name: string, networkId: number): Promise<boolean> {
    try {
      const response = await this.request<{ zones: Zone[] }>(`/zones?network_id=${networkId}`);
      return response.zones.some(zone => 
        zone.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
    } catch (error) {
      console.error('Error checking existing zone:', error);
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
      console.error('Error checking existing advertisement:', error);
      return false; // Assume no conflict if we can't check
    }
  }
}

export const broadstreetAPI = new BroadstreetAPI();
export default broadstreetAPI;
