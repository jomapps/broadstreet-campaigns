# Zustand Implementation Plan for Broadstreet Campaigns

## Overview

This document outlines the complete migration from the current FilterContext + server-side data fetching approach to a clean architecture using:

1. **Server-side pages** with PayloadCMS Local API pattern for data fetching
2. **Zustand** for client-side state management
3. **Clean separation** between server data fetching and client state

## Architecture Goals

### Current Problems
- ❌ Complex FilterContext with mixed concerns
- ❌ Server-client hydration issues
- ❌ Props drilling and serialization problems
- ❌ Mixed server/client data fetching patterns

### Target Architecture
- ✅ Server pages handle `searchParams` and data fetching
- ✅ Zustand stores for clean client state management
- ✅ No hydration issues (server data → client state)
- ✅ Type-safe state management
- ✅ Predictable data flow

## Phase 1: Zustand Store Setup

### Task 1.1: Install Dependencies

```bash
pnpm add zustand immer
pnpm add -D @types/node
```

### Task 1.2: Create Base Store Structure

**File: `src/stores/index.ts`**
```typescript
export { useAppStore } from './app-store';
export { useEntityStore } from './entity-store';
export { useFilterStore } from './filter-store';
export { useSyncStore } from './sync-store';
export type * from './types';
```

### Task 1.3: Define Store Types

**File: `src/stores/types.ts`**
```typescript
import { Network, Advertiser, Campaign, Zone, Advertisement } from '@/lib/types/broadstreet';

// Entity state types
export interface EntityState {
  networks: Network[];
  advertisers: Advertiser[];
  campaigns: Campaign[];
  zones: Zone[];
  advertisements: Advertisement[];
  
  // Local entities
  localZones: any[];
  localAdvertisers: any[];
  localCampaigns: any[];
  localNetworks: any[];
  localAdvertisements: any[];
  localPlacements: any[];
  
  // Loading states
  isLoading: {
    networks: boolean;
    advertisers: boolean;
    campaigns: boolean;
    zones: boolean;
    advertisements: boolean;
    localEntities: boolean;
  };
  
  // Error states
  errors: {
    networks: string | null;
    advertisers: string | null;
    campaigns: string | null;
    zones: string | null;
    advertisements: string | null;
    localEntities: string | null;
  };
}

// Filter state types
export interface FilterState {
  selectedNetwork: Network | null;
  selectedAdvertiser: Advertiser | null;
  selectedCampaign: Campaign | null;
  selectedZones: string[];
  selectedAdvertisements: string[];
  selectedTheme: { _id: string; name: string; zone_ids: number[] } | null;
  showOnlySelected: boolean;
  showOnlySelectedAds: boolean;
}

// Sync state types
export interface SyncState {
  isActive: boolean;
  progress: number;
  currentPhase: string;
  message: string;
  errors: string[];
  lastSyncTime: Date | null;
}

// App state types
export interface AppState {
  sidebarCollapsed: boolean;
  currentPage: string;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}
```

### Task 1.4: Create Entity Store

**File: `src/stores/entity-store.ts`**
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { EntityState } from './types';

interface EntityActions {
  // Setters
  setNetworks: (networks: any[]) => void;
  setAdvertisers: (advertisers: any[]) => void;
  setCampaigns: (campaigns: any[]) => void;
  setZones: (zones: any[]) => void;
  setAdvertisements: (advertisements: any[]) => void;
  setLocalEntities: (entities: {
    zones: any[];
    advertisers: any[];
    campaigns: any[];
    networks: any[];
    advertisements: any[];
    placements: any[];
  }) => void;
  
  // Loading states
  setLoading: (entity: keyof EntityState['isLoading'], loading: boolean) => void;
  
  // Error states
  setError: (entity: keyof EntityState['errors'], error: string | null) => void;
  
  // Clear actions
  clearAll: () => void;
  clearEntity: (entity: string) => void;
}

const initialState: EntityState = {
  networks: [],
  advertisers: [],
  campaigns: [],
  zones: [],
  advertisements: [],
  localZones: [],
  localAdvertisers: [],
  localCampaigns: [],
  localNetworks: [],
  localAdvertisements: [],
  localPlacements: [],
  isLoading: {
    networks: false,
    advertisers: false,
    campaigns: false,
    zones: false,
    advertisements: false,
    localEntities: false,
  },
  errors: {
    networks: null,
    advertisers: null,
    campaigns: null,
    zones: null,
    advertisements: null,
    localEntities: null,
  },
};

export const useEntityStore = create<EntityState & EntityActions>()(
  immer((set) => ({
    ...initialState,
    
    setNetworks: (networks) => set((state) => {
      state.networks = networks;
      state.isLoading.networks = false;
      state.errors.networks = null;
    }),
    
    setAdvertisers: (advertisers) => set((state) => {
      state.advertisers = advertisers;
      state.isLoading.advertisers = false;
      state.errors.advertisers = null;
    }),
    
    setCampaigns: (campaigns) => set((state) => {
      state.campaigns = campaigns;
      state.isLoading.campaigns = false;
      state.errors.campaigns = null;
    }),
    
    setZones: (zones) => set((state) => {
      state.zones = zones;
      state.isLoading.zones = false;
      state.errors.zones = null;
    }),
    
    setAdvertisements: (advertisements) => set((state) => {
      state.advertisements = advertisements;
      state.isLoading.advertisements = false;
      state.errors.advertisements = null;
    }),
    
    setLocalEntities: (entities) => set((state) => {
      state.localZones = entities.zones;
      state.localAdvertisers = entities.advertisers;
      state.localCampaigns = entities.campaigns;
      state.localNetworks = entities.networks;
      state.localAdvertisements = entities.advertisements;
      state.localPlacements = entities.placements;
      state.isLoading.localEntities = false;
      state.errors.localEntities = null;
    }),
    
    setLoading: (entity, loading) => set((state) => {
      state.isLoading[entity] = loading;
    }),
    
    setError: (entity, error) => set((state) => {
      state.errors[entity] = error;
      state.isLoading[entity] = false;
    }),
    
    clearAll: () => set(() => initialState),
    
    clearEntity: (entity) => set((state) => {
      if (entity in state) {
        (state as any)[entity] = [];
      }
    }),
  }))
);
```

## Phase 2: Page Refactoring

### Task 2.1: Create Server Data Fetching Utilities

**File: `src/lib/server/data-fetchers.ts`**
```typescript
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

export async function fetchNetworks(params?: any) {
  await connectDB();
  return await Network.find({}).sort({ name: 1 }).lean();
}

export async function fetchAdvertisers(networkId?: number) {
  await connectDB();
  const query = networkId ? { network_id: networkId } : {};
  return await Advertiser.find(query).sort({ name: 1 }).lean();
}

export async function fetchZones(networkId?: number) {
  await connectDB();
  const query = networkId ? { network_id: networkId } : {};
  return await Zone.find(query).sort({ name: 1 }).lean();
}

export async function fetchCampaigns(params?: { networkId?: number; advertiserId?: number }) {
  await connectDB();
  const query: any = {};
  if (params?.networkId) query.network_id = params.networkId;
  if (params?.advertiserId) query.advertiser_id = params.advertiserId;
  return await Campaign.find(query).sort({ name: 1 }).lean();
}

export async function fetchAdvertisements(networkId?: number) {
  await connectDB();
  const query = networkId ? { network_id: networkId } : {};
  return await Advertisement.find(query).sort({ name: 1 }).lean();
}

export async function fetchLocalEntities() {
  await connectDB();
  
  const [localZones, localAdvertisers, localCampaigns, localNetworks, localAdvertisements, localPlacements] = await Promise.all([
    LocalZone.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
    LocalAdvertiser.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
    LocalCampaign.find({ $or: [{ synced_with_api: false }, { 'placements.0': { $exists: true } }] }).sort({ created_at: -1 }).lean(),
    LocalNetwork.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
    LocalAdvertisement.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
    Placement.find({ created_locally: true, synced_with_api: false }).sort({ created_at: -1 }).lean(),
  ]);
  
  return {
    zones: localZones.map(serializeEntity),
    advertisers: localAdvertisers.map(serializeEntity),
    campaigns: localCampaigns.map(serializeEntity),
    networks: localNetworks.map(serializeEntity),
    advertisements: localAdvertisements.map(serializeEntity),
    placements: localPlacements.map(serializeEntity),
  };
}

function serializeEntity(entity: any) {
  return {
    ...entity,
    _id: entity._id?.toString(),
    created_at: entity.created_at?.toISOString(),
    updated_at: entity.updated_at?.toISOString(),
    synced_at: entity.synced_at?.toISOString(),
  };
}
```

### Task 2.2: Refactor Local-Only Page

**File: `src/app/local-only/page.tsx`**
```typescript
import { Suspense } from 'react';
import { fetchLocalEntities, fetchNetworks } from '@/lib/server/data-fetchers';
import LocalOnlyClient from './LocalOnlyClient';
import LoadingSkeleton from './LoadingSkeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LocalOnlyPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LocalOnlyPage({ searchParams }: LocalOnlyPageProps) {
  // 1. Await searchParams (Next.js 15 requirement)
  const params = await searchParams;
  
  // 2. Fetch necessary data server-side
  const [localEntities, networks] = await Promise.all([
    fetchLocalEntities(),
    fetchNetworks(),
  ]);
  
  // 3. Pass data to client component
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Local Only</h1>
          <p className="card-text text-gray-600 mt-1">
            Manage locally created entities before syncing to Broadstreet
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <LocalOnlyClient 
          initialLocalEntities={localEntities}
          initialNetworks={networks}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}
```

**File: `src/app/local-only/LocalOnlyClient.tsx`**
```typescript
'use client';

import { useEffect } from 'react';
import { useEntityStore } from '@/stores';
import LocalOnlyDashboard from './LocalOnlyDashboard';

interface LocalOnlyClientProps {
  initialLocalEntities: any;
  initialNetworks: any[];
  searchParams: any;
}

export default function LocalOnlyClient({ 
  initialLocalEntities, 
  initialNetworks,
  searchParams 
}: LocalOnlyClientProps) {
  const { setLocalEntities, setNetworks } = useEntityStore();
  
  // Initialize store with server data
  useEffect(() => {
    setLocalEntities(initialLocalEntities);
    setNetworks(initialNetworks);
  }, [initialLocalEntities, initialNetworks, setLocalEntities, setNetworks]);
  
  return <LocalOnlyDashboard />;
}
```

### Task 2.3: Refactor Dashboard Page

**File: `src/app/dashboard/page.tsx`**
```typescript
import { Suspense } from 'react';
import { fetchNetworks, fetchAdvertisers, fetchZones, fetchCampaigns } from '@/lib/server/data-fetchers';
import DashboardClient from './DashboardClient';
import LoadingSkeleton from './LoadingSkeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DashboardPageProps {
  searchParams: Promise<{
    network?: string;
    advertiser?: string;
    campaign?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // 1. Await searchParams
  const params = await searchParams;

  // 2. Parse parameters
  const networkId = params.network ? parseInt(params.network) : undefined;
  const advertiserId = params.advertiser ? parseInt(params.advertiser) : undefined;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');

  // 3. Fetch data based on parameters
  const [networks, advertisers, zones, campaigns] = await Promise.all([
    fetchNetworks(),
    fetchAdvertisers(networkId),
    fetchZones(networkId),
    fetchCampaigns({ networkId, advertiserId }),
  ]);

  // 4. Pass to client
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="card-text text-gray-600 mt-1">
            Overview of your Broadstreet campaigns and performance
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <DashboardClient
          initialNetworks={networks}
          initialAdvertisers={advertisers}
          initialZones={zones}
          initialCampaigns={campaigns}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}
```

### Task 2.4: Refactor Networks Page

**File: `src/app/networks/page.tsx`**
```typescript
import { Suspense } from 'react';
import { fetchNetworks } from '@/lib/server/data-fetchers';
import NetworksClient from './NetworksClient';
import LoadingSkeleton from './LoadingSkeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface NetworksPageProps {
  searchParams: Promise<{
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }>;
}

export default async function NetworksPage({ searchParams }: NetworksPageProps) {
  // 1. Await searchParams
  const params = await searchParams;

  // 2. Fetch networks with search/sort parameters
  const networks = await fetchNetworks(params);

  // 3. Pass to client
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Networks</h1>
          <p className="card-text text-gray-600 mt-1">
            Manage your advertising networks
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <NetworksClient
          initialNetworks={networks}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}
```

### Task 2.5: Refactor Advertisers Page

**File: `src/app/advertisers/page.tsx`**
```typescript
import { Suspense } from 'react';
import { fetchAdvertisers, fetchNetworks } from '@/lib/server/data-fetchers';
import AdvertisersClient from './AdvertisersClient';
import LoadingSkeleton from './LoadingSkeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AdvertisersPageProps {
  searchParams: Promise<{
    network?: string;
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AdvertisersPage({ searchParams }: AdvertisersPageProps) {
  // 1. Await searchParams
  const params = await searchParams;

  // 2. Parse parameters
  const networkId = params.network ? parseInt(params.network) : undefined;

  // 3. Fetch data
  const [advertisers, networks] = await Promise.all([
    fetchAdvertisers(networkId),
    fetchNetworks(),
  ]);

  // 4. Pass to client
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Advertisers</h1>
          <p className="card-text text-gray-600 mt-1">
            Manage advertisers across your networks
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <AdvertisersClient
          initialAdvertisers={advertisers}
          initialNetworks={networks}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}
```

## Phase 3: Filter Store Implementation

### Task 3.1: Create Filter Store

**File: `src/stores/filter-store.ts`**
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { FilterState } from './types';

interface FilterActions {
  // Selection actions
  setSelectedNetwork: (network: any | null) => void;
  setSelectedAdvertiser: (advertiser: any | null) => void;
  setSelectedCampaign: (campaign: any | null) => void;
  setSelectedZones: (zones: string[]) => void;
  setSelectedAdvertisements: (advertisements: string[]) => void;
  setSelectedTheme: (theme: any | null) => void;

  // Toggle actions
  toggleZoneSelection: (zoneId: string) => void;
  toggleAdvertisementSelection: (adId: string) => void;

  // Bulk actions
  selectAllZones: (zoneIds: string[]) => void;
  deselectAllZones: () => void;
  selectAllAdvertisements: (adIds: string[]) => void;
  deselectAllAdvertisements: () => void;

  // Display options
  setShowOnlySelected: (show: boolean) => void;
  setShowOnlySelectedAds: (show: boolean) => void;

  // Clear actions
  clearAllFilters: () => void;
  clearSelections: () => void;
}

const initialState: FilterState = {
  selectedNetwork: null,
  selectedAdvertiser: null,
  selectedCampaign: null,
  selectedZones: [],
  selectedAdvertisements: [],
  selectedTheme: null,
  showOnlySelected: false,
  showOnlySelectedAds: false,
};

export const useFilterStore = create<FilterState & FilterActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      setSelectedNetwork: (network) => set((state) => {
        state.selectedNetwork = network;
        // Clear dependent selections
        state.selectedAdvertiser = null;
        state.selectedCampaign = null;
        state.selectedZones = [];
        state.selectedAdvertisements = [];
        state.selectedTheme = null;
      }),

      setSelectedAdvertiser: (advertiser) => set((state) => {
        state.selectedAdvertiser = advertiser;
        // Clear dependent selections
        state.selectedCampaign = null;
      }),

      setSelectedCampaign: (campaign) => set((state) => {
        state.selectedCampaign = campaign;
      }),

      setSelectedZones: (zones) => set((state) => {
        state.selectedZones = zones;
        // Clear theme if zones don't match
        if (state.selectedTheme) {
          const themeZoneIds = state.selectedTheme.zone_ids.map(String);
          const zonesMatch = zones.length === themeZoneIds.length &&
            zones.every(id => themeZoneIds.includes(id));
          if (!zonesMatch) {
            state.selectedTheme = null;
          }
        }
      }),

      setSelectedAdvertisements: (advertisements) => set((state) => {
        state.selectedAdvertisements = advertisements;
      }),

      setSelectedTheme: (theme) => set((state) => {
        state.selectedTheme = theme;
        // Update zones to match theme
        if (theme) {
          state.selectedZones = theme.zone_ids.map(String);
        }
      }),

      toggleZoneSelection: (zoneId) => set((state) => {
        const index = state.selectedZones.indexOf(zoneId);
        if (index > -1) {
          state.selectedZones.splice(index, 1);
        } else {
          state.selectedZones.push(zoneId);
        }
        // Clear theme if zones no longer match
        if (state.selectedTheme) {
          const themeZoneIds = state.selectedTheme.zone_ids.map(String);
          const zonesMatch = state.selectedZones.length === themeZoneIds.length &&
            state.selectedZones.every(id => themeZoneIds.includes(id));
          if (!zonesMatch) {
            state.selectedTheme = null;
          }
        }
      }),

      toggleAdvertisementSelection: (adId) => set((state) => {
        const index = state.selectedAdvertisements.indexOf(adId);
        if (index > -1) {
          state.selectedAdvertisements.splice(index, 1);
        } else {
          state.selectedAdvertisements.push(adId);
        }
      }),

      selectAllZones: (zoneIds) => set((state) => {
        state.selectedZones = [...zoneIds];
      }),

      deselectAllZones: () => set((state) => {
        state.selectedZones = [];
        state.selectedTheme = null;
      }),

      selectAllAdvertisements: (adIds) => set((state) => {
        state.selectedAdvertisements = [...adIds];
      }),

      deselectAllAdvertisements: () => set((state) => {
        state.selectedAdvertisements = [];
      }),

      setShowOnlySelected: (show) => set((state) => {
        state.showOnlySelected = show;
      }),

      setShowOnlySelectedAds: (show) => set((state) => {
        state.showOnlySelectedAds = show;
      }),

      clearAllFilters: () => set(() => initialState),

      clearSelections: () => set((state) => {
        state.selectedZones = [];
        state.selectedAdvertisements = [];
        state.selectedTheme = null;
        state.showOnlySelected = false;
        state.showOnlySelectedAds = false;
      }),
    })),
    {
      name: 'broadstreet-filters',
      partialize: (state) => ({
        selectedNetwork: state.selectedNetwork,
        selectedAdvertiser: state.selectedAdvertiser,
        selectedCampaign: state.selectedCampaign,
        selectedTheme: state.selectedTheme,
        showOnlySelected: state.showOnlySelected,
        showOnlySelectedAds: state.showOnlySelectedAds,
      }),
    }
  )
);
```

## Phase 4: Sync Store Implementation

### Task 4.1: Create Sync Store

**File: `src/stores/sync-store.ts`**
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { SyncState } from './types';

interface SyncActions {
  startSync: () => void;
  updateProgress: (progress: number, phase: string, message: string) => void;
  addError: (error: string) => void;
  completeSync: (success: boolean) => void;
  resetSync: () => void;
}

const initialState: SyncState = {
  isActive: false,
  progress: 0,
  currentPhase: '',
  message: '',
  errors: [],
  lastSyncTime: null,
};

export const useSyncStore = create<SyncState & SyncActions>()(
  immer((set) => ({
    ...initialState,

    startSync: () => set((state) => {
      state.isActive = true;
      state.progress = 0;
      state.currentPhase = 'initializing';
      state.message = 'Starting sync...';
      state.errors = [];
    }),

    updateProgress: (progress, phase, message) => set((state) => {
      state.progress = progress;
      state.currentPhase = phase;
      state.message = message;
    }),

    addError: (error) => set((state) => {
      state.errors.push(error);
    }),

    completeSync: (success) => set((state) => {
      state.isActive = false;
      state.progress = 100;
      state.currentPhase = success ? 'completed' : 'failed';
      state.message = success ? 'Sync completed successfully' : 'Sync failed';
      state.lastSyncTime = new Date();
    }),

    resetSync: () => set(() => initialState),
  }))
);
```

### Task 4.2: Create App Store

**File: `src/stores/app-store.ts`**
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { AppState, Notification } from './types';

interface AppActions {
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentPage: (page: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const initialState: AppState = {
  sidebarCollapsed: false,
  currentPage: '',
  notifications: [],
};

export const useAppStore = create<AppState & AppActions>()(
  persist(
    immer((set) => ({
      ...initialState,

      setSidebarCollapsed: (collapsed) => set((state) => {
        state.sidebarCollapsed = collapsed;
      }),

      setCurrentPage: (page) => set((state) => {
        state.currentPage = page;
      }),

      addNotification: (notification) => set((state) => {
        const newNotification: Notification = {
          ...notification,
          id: Date.now().toString(),
          timestamp: new Date(),
          read: false,
        };
        state.notifications.unshift(newNotification);
        // Keep only last 50 notifications
        if (state.notifications.length > 50) {
          state.notifications = state.notifications.slice(0, 50);
        }
      }),

      markNotificationRead: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification) {
          notification.read = true;
        }
      }),

      removeNotification: (id) => set((state) => {
        state.notifications = state.notifications.filter(n => n.id !== id);
      }),

      clearAllNotifications: () => set((state) => {
        state.notifications = [];
      }),
    })),
    {
      name: 'broadstreet-app',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
```

## Phase 5: Migration Tasks

### Task 5.1: Update All Remaining Pages

**Pages to refactor following the same pattern:**

1. **Zones Page** (`src/app/zones/page.tsx`)
   - Fetch zones with network filtering
   - Handle search and pagination parameters
   - Pass to ZonesClient component

2. **Campaigns Page** (`src/app/campaigns/page.tsx`)
   - Fetch campaigns with network/advertiser filtering
   - Handle status and date range parameters
   - Pass to CampaignsClient component

3. **Advertisements Page** (`src/app/advertisements/page.tsx`)
   - Fetch advertisements with network filtering
   - Handle type and status parameters
   - Pass to AdvertisementsClient component

4. **Placements Page** (`src/app/placements/page.tsx`)
   - Fetch placements with campaign/zone filtering
   - Handle date range and status parameters
   - Pass to PlacementsClient component

5. **Themes Pages** (`src/app/themes/page.tsx` and `src/app/themes/[id]/page.tsx`)
   - Fetch themes and theme details
   - Handle theme-specific zone filtering
   - Pass to ThemesClient components

6. **Audit Page** (`src/app/audit/page.tsx`)
   - Fetch audit logs and sync history
   - Handle date range and entity type filtering
   - Pass to AuditClient component

### Task 5.2: Create Client Components

For each page, create corresponding client components that:

1. **Initialize store with server data**
2. **Handle client-side interactions**
3. **Read from Zustand stores instead of props**
4. **Update stores on user actions**

Example pattern:
```typescript
'use client';

import { useEffect } from 'react';
import { useEntityStore, useFilterStore } from '@/stores';

interface PageClientProps {
  initialData: any;
  searchParams: any;
}

export default function PageClient({ initialData, searchParams }: PageClientProps) {
  const { setData } = useEntityStore();
  const { setFiltersFromParams } = useFilterStore();

  useEffect(() => {
    setData(initialData);
    setFiltersFromParams(searchParams);
  }, [initialData, searchParams]);

  return <PageContent />;
}
```

### Task 5.3: Remove FilterContext

1. **Delete** `src/contexts/FilterContext.tsx`
2. **Update imports** throughout the codebase to use Zustand stores
3. **Remove FilterProvider** from layout components
4. **Update hooks** to use Zustand selectors

### Task 5.4: Update Hooks

**File: `src/lib/hooks/use-selected-entities.ts`**
```typescript
import { useEntityStore, useFilterStore } from '@/stores';
import { useMemo } from 'react';

export function useSelectedEntities() {
  const {
    networks,
    advertisers,
    campaigns,
    zones,
    advertisements
  } = useEntityStore();

  const {
    selectedNetwork,
    selectedAdvertiser,
    selectedCampaign,
    selectedZones,
    selectedAdvertisements,
  } = useFilterStore();

  return useMemo(() => ({
    selectedNetwork,
    selectedAdvertiser,
    selectedCampaign,
    selectedZones,
    selectedAdvertisements,

    // Computed values
    filteredZones: zones.filter(zone =>
      !selectedNetwork || zone.network_id === selectedNetwork.broadstreet_id
    ),

    filteredAdvertisements: advertisements.filter(ad =>
      !selectedNetwork || ad.network_id === selectedNetwork.broadstreet_id
    ),

    // Helper functions
    isZoneSelected: (zoneId: string) => selectedZones.includes(zoneId),
    isAdvertisementSelected: (adId: string) => selectedAdvertisements.includes(adId),
  }), [
    networks, advertisers, campaigns, zones, advertisements,
    selectedNetwork, selectedAdvertiser, selectedCampaign,
    selectedZones, selectedAdvertisements
  ]);
}
```

## Phase 6: Testing and Validation

### Task 6.1: Component Testing
- Test each page loads correctly with server data
- Verify store initialization works properly
- Test client-side interactions update stores
- Validate persistence works for filters

### Task 6.2: Integration Testing
- Test navigation between pages maintains state
- Verify search params are handled correctly
- Test sync functionality with new stores
- Validate error handling and loading states

### Task 6.3: Performance Testing
- Measure page load times vs current implementation
- Test store update performance with large datasets
- Verify no unnecessary re-renders
- Test memory usage with store persistence

## Phase 7: Cleanup and Documentation

### Task 7.1: Remove Legacy Code
- Delete unused FilterContext files
- Remove server-side data fetching from components
- Clean up unused props and interfaces
- Remove hydration workarounds

### Task 7.2: Update Documentation
- Document new store architecture
- Update component usage examples
- Create migration guide for future changes
- Document best practices for new pages

## Implementation Timeline

**Week 1**: Phase 1-2 (Store setup + 2-3 pages)
**Week 2**: Phase 3-4 (Filter/Sync stores + remaining pages)
**Week 3**: Phase 5-6 (Migration + testing)
**Week 4**: Phase 7 (Cleanup + documentation)

## Benefits of This Architecture

1. **Clean Separation**: Server handles data fetching, client handles interactions
2. **No Hydration Issues**: Server data flows cleanly to client stores
3. **Type Safety**: Full TypeScript support with Zustand
4. **Performance**: Optimized re-renders with store selectors
5. **Maintainability**: Clear data flow and single source of truth
6. **Testability**: Easy to test stores and components separately
7. **Scalability**: Easy to add new pages following the same pattern
```
