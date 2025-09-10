// Broadstreet API Types based on API specification

export interface Network {
  id: number;
  name: string;
  group_id?: number | null;
  web_home_url?: string;
  logo?: {
    url: string;
  };
  valet_active: boolean;
  path: string;
  advertiser_count?: number;
  zone_count?: number;
}

export interface Advertiser {
  id: number;
  name: string;
  logo?: {
    url: string;
  };
  web_home_url?: string;
  notes?: string | null;
  admins?: Array<{
    name: string;
    email: string;
  }>;
}

export interface Zone {
  id: number;
  name: string;
  network_id: number;
  alias?: string | null;
  self_serve: boolean;
}

export interface Campaign {
  id: number;
  name: string;
  advertiser_id: number;
  start_date: string;
  end_date?: string;
  max_impression_count?: number;
  display_type: 'no_repeat' | 'allow_repeat_campaign' | 'allow_repeat_advertisement' | 'force_repeat_campaign';
  active: boolean;
  weight: number;
  path: string;
  archived?: boolean;
  pacing_type?: 'asap' | 'even';
  impression_max_type?: 'cap' | 'goal';
  paused?: boolean;
  notes?: string;
}

export interface Advertisement {
  id: number;
  name: string;
  updated_at: string;
  type: string;
  advertiser: string;
  active: {
    url?: string | null;
  };
  active_placement: boolean;
  preview_url: string;
}

export interface Placement {
  advertisement_id: number;
  zone_id: number;
  campaign_id: number;
  restrictions?: string[];
}

// API Response Types
export interface NetworksResponse {
  networks: Network[];
}

export interface AdvertisersResponse {
  advertisers: Advertiser[];
}

export interface ZonesResponse {
  zones: Zone[];
}

export interface CampaignsResponse {
  campaigns: Campaign[];
}

export interface AdvertisementsResponse {
  advertisements: Advertisement[];
}

export interface PlacementsResponse {
  placement: Placement;
}

// Zone Size Types
export type ZoneSize = 'SQ' | 'PT' | 'LS';

export interface ZoneSizeInfo {
  type: ZoneSize;
  dimensions: string;
  description: string;
}

// Sync Status Types
export interface SyncStatus {
  entity: string;
  lastSync: Date;
  status: 'success' | 'error' | 'pending';
  recordCount: number;
  error?: string;
}

// Fallback Ad Creation Types
export interface FallbackAdRequest {
  networkId: number;
  advertiserId: number;
  campaignId: number;
  advertisementIds: number[];
  sizes: ZoneSize[];
}

export interface FallbackAdResponse {
  placementsCreated: number;
  placements: Placement[];
  zonesMatched: Zone[];
}
