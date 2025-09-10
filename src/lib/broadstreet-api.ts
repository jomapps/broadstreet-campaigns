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
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
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

  // Advertisers
  async getAdvertisers(networkId: number): Promise<Advertiser[]> {
    const response = await this.request<AdvertisersResponse>(`/advertisers?network_id=${networkId}`);
    return response.advertisers;
  }

  async getAdvertiser(id: number): Promise<Advertiser> {
    const response = await this.request<{ advertiser: Advertiser }>(`/advertisers/${id}`);
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
}

export const broadstreetAPI = new BroadstreetAPI();
export default broadstreetAPI;
