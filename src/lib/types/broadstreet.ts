// Broadstreet API Types based on API specification

export interface Network {
  broadstreet_id: number;
  mongo_id?: string;
  // New explicit naming to avoid confusion
  broadstreet_network_id?: number;
  local_network_id?: string;
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
  broadstreet_id: number;
  mongo_id?: string;
  // New explicit naming to avoid confusion
  broadstreet_advertiser_id?: number;
  local_advertiser_id?: string;
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
  broadstreet_id: number;
  mongo_id?: string;
  // New explicit naming to avoid confusion
  broadstreet_zone_id?: number;
  local_zone_id?: string;
  name: string;
  network_id: number;
  alias?: string | null;
  self_serve: boolean;
}

export interface Campaign {
  broadstreet_id: number;
  mongo_id?: string;
  // New explicit naming to avoid confusion
  broadstreet_campaign_id?: number;
  local_campaign_id?: string;
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
  broadstreet_id: number;
  mongo_id?: string;
  // New explicit naming to avoid confusion
  broadstreet_advertisement_id?: number;
  local_advertisement_id?: string;
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
  campaign_id: number; // Added by us when storing locally, not in API response
  restrictions?: string[]; // API returns array of strings
}

// API Response Types
export interface NetworksResponse {
  networks: any[];
}

export interface AdvertisersResponse {
  advertisers: any[];
}

export interface ZonesResponse {
  zones: any[];
}

export interface CampaignsResponse {
  campaigns: any[];
}

export interface AdvertisementsResponse {
  advertisements: any[];
}

export interface PlacementsResponse {
  placement: any;
}

// Zone Size Types
export type ZoneSize = 'SQ' | 'PT' | 'LS' | 'CS';

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

