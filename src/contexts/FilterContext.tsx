'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Network, Advertiser, Campaign } from '@/lib/types/broadstreet';
import { getEntityId } from '@/lib/utils/entity-helpers';

/**
 * FilterContext
 *
 * Guidance:
 * - For reading selected entities (network/advertiser/campaign/zones/advertisements), prefer
 *   useSelectedEntities from `src/lib/hooks/use-selected-entities` which normalizes structure
 *   and reduces re-renders.
 * - Use useFilters ONLY when you need setters (e.g., setSelectedCampaign), arrays, or loading flags.
 * - clearAllFilters is the primary clear method. Individual clear methods are deprecated and removed.
 */
interface FilterContextType {
  // Selected filters
  selectedNetwork: Network | null;
  selectedAdvertiser: Advertiser | null;
  selectedCampaign: Campaign | null;

  // Zone selection
  selectedZones: string[]; // Array of zone IDs
  showOnlySelected: boolean;

  // Theme selection for zones
  selectedTheme: { _id: string; name: string; zone_ids: number[] } | null;

  // Advertisement selection
  selectedAdvertisements: string[]; // Array of advertisement IDs
  showOnlySelectedAds: boolean;
  
  // Setters
  setSelectedNetwork: (network: any | null) => void;
  setSelectedAdvertiser: (advertiser: any | null) => void;
  setSelectedCampaign: (campaign: any | null) => void;
  setSelectedZones: (zones: string[]) => void;
  setShowOnlySelected: (show: boolean) => void;
  setSelectedTheme: (theme: { _id: string; name: string; zone_ids: number[] } | null) => void;
  setSelectedAdvertisements: (advertisements: string[]) => void;
  setShowOnlySelectedAds: (show: boolean) => void;
  
  // Data
  networks: Network[];
  advertisers: Advertiser[];
  campaigns: Campaign[];
  
  // Data setters
  setNetworks: (networks: Network[]) => void;
  setAdvertisers: (advertisers: Advertiser[]) => void;
  setCampaigns: (campaigns: Campaign[]) => void;
  
  // Loading states
  isLoadingNetworks: boolean;
  isLoadingAdvertisers: boolean;
  isLoadingCampaigns: boolean;
  
  // Loading setters
  setIsLoadingNetworks: (loading: boolean) => void;
  setIsLoadingAdvertisers: (loading: boolean) => void;
  setIsLoadingCampaigns: (loading: boolean) => void;
  
  // Clear filters
  clearAllFilters: () => void;
  
  // Zone selection actions
  selectZones: (zoneIds: string[]) => void;
  deselectZones: (zoneIds: string[]) => void;
  toggleZoneSelection: (zoneId: string) => void;
  selectThemeZones: (theme: { _id: string; name: string; zone_ids: number[] } | null) => void;

  // Advertisement selection actions
  selectAdvertisements: (advertisementIds: string[]) => void;
  deselectAdvertisements: (advertisementIds: string[]) => void;
  toggleAdvertisementSelection: (advertisementId: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const STORAGE_KEYS = {
  NETWORK: 'broadstreet_selected_network',
  ADVERTISER: 'broadstreet_selected_advertiser',
  CAMPAIGN: 'broadstreet_selected_campaign',
  SELECTED_ZONES: 'broadstreet_selected_zones',
  SHOW_ONLY_SELECTED: 'broadstreet_show_only_selected',
  SELECTED_THEME: 'broadstreet_selected_theme',
  SELECTED_ADVERTISEMENTS: 'broadstreet_selected_advertisements',
  SHOW_ONLY_SELECTED_ADS: 'broadstreet_show_only_selected_ads',
};

// Hardcoded default network to ensure the app always has a network immediately.
// BS #9396 — FASH Medien Verlag GmbH - SCHWULISSIMO image
const DEFAULT_NETWORK: Network = {
  broadstreet_id: 9396,
  name: 'FASH Medien Verlag GmbH - SCHWULISSIMO image',
  valet_active: false,
  path: '',
};

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<Advertiser | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [showOnlySelected, setShowOnlySelected] = useState<boolean>(false);
  const [selectedTheme, setSelectedTheme] = useState<{ _id: string; name: string; zone_ids: number[] } | null>(null);
  const [selectedAdvertisements, setSelectedAdvertisements] = useState<string[]>([]);
  const [showOnlySelectedAds, setShowOnlySelectedAds] = useState<boolean>(false);
  
  const [networks, setNetworks] = useState<Network[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  const [isLoadingNetworks, setIsLoadingNetworks] = useState(false);
  const [isLoadingAdvertisers, setIsLoadingAdvertisers] = useState(false);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const storedNetwork = localStorage.getItem(STORAGE_KEYS.NETWORK);
        const storedAdvertiser = localStorage.getItem(STORAGE_KEYS.ADVERTISER);
        const storedCampaign = localStorage.getItem(STORAGE_KEYS.CAMPAIGN);
        const storedSelectedZones = localStorage.getItem(STORAGE_KEYS.SELECTED_ZONES);
        const storedShowOnlySelected = localStorage.getItem(STORAGE_KEYS.SHOW_ONLY_SELECTED);
        const storedSelectedTheme = localStorage.getItem(STORAGE_KEYS.SELECTED_THEME);
        const storedSelectedAdvertisements = localStorage.getItem(STORAGE_KEYS.SELECTED_ADVERTISEMENTS);
        const storedShowOnlySelectedAds = localStorage.getItem(STORAGE_KEYS.SHOW_ONLY_SELECTED_ADS);
        
        if (storedNetwork) {
          setSelectedNetwork(JSON.parse(storedNetwork));
        } else {
          // Ensure a network is immediately available
          setSelectedNetwork(DEFAULT_NETWORK);
        }
        if (storedAdvertiser) {
          setSelectedAdvertiser(JSON.parse(storedAdvertiser));
        }
        if (storedCampaign) {
          setSelectedCampaign(JSON.parse(storedCampaign));
        }
        if (storedSelectedZones) {
          setSelectedZones(JSON.parse(storedSelectedZones));
        }
        if (storedShowOnlySelected) {
          setShowOnlySelected(JSON.parse(storedShowOnlySelected));
        }
        if (storedSelectedTheme) {
          setSelectedTheme(JSON.parse(storedSelectedTheme));
        }
        if (storedSelectedAdvertisements) {
          setSelectedAdvertisements(JSON.parse(storedSelectedAdvertisements));
        }
        if (storedShowOnlySelectedAds) {
          setShowOnlySelectedAds(JSON.parse(storedShowOnlySelectedAds));
        }
      } catch (error) {
        console.error('Error loading filters from localStorage:', error);
      }
    };

    loadFromStorage();
  }, []);

  // Load networks on mount
  useEffect(() => {
    const loadNetworks = async () => {
      setIsLoadingNetworks(true);
      try {
        const response = await fetch('/api/networks');
        if (response.ok) {
          const data = await response.json();
          setNetworks(data.networks || []);

          // Respect hardcoded/default selection: if nothing selected yet, prefer the hardcoded
          // network from the fetched list. Otherwise, enrich the current selection from fetched data.
          try {
            const stored = localStorage.getItem(STORAGE_KEYS.NETWORK);
            const storedParsed = stored ? JSON.parse(stored) : null;
            const current = storedParsed || selectedNetwork;
            if (!current) {
              const match = (data.networks || []).find((n: any) => getEntityId(n) === DEFAULT_NETWORK.broadstreet_id);
              setSelectedNetwork(match || DEFAULT_NETWORK);
            } else {
              const currentId = getEntityId(current);
              const enriched = (data.networks || []).find((n: any) => getEntityId(n) === currentId);
              if (enriched) setSelectedNetwork(enriched);
            }
          } catch {
            // fallback: do nothing, selection already set earlier
          }
        }
      } catch (error) {
        console.error('Failed to load networks:', error);
      } finally {
        setIsLoadingNetworks(false);
      }
    };

    loadNetworks();
  }, []);

  // Load advertisers when network changes
  useEffect(() => {
    const loadAdvertisers = async () => {
      if (!selectedNetwork) {
        setAdvertisers([]);
        return;
      }

      setIsLoadingAdvertisers(true);
      try {
        const nid = getEntityId(selectedNetwork);
        const response = await fetch(`/api/advertisers?network_id=${nid}`, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setAdvertisers(data.advertisers || []);
        }
      } catch (error) {
        console.error('Failed to load advertisers:', error);
      } finally {
        setIsLoadingAdvertisers(false);
      }
    };

    loadAdvertisers();
  }, [selectedNetwork]);

  // Load campaigns when advertiser changes
  useEffect(() => {
    const loadCampaigns = async () => {
      if (!selectedAdvertiser) {
        setCampaigns([]);
        return;
      }

      setIsLoadingCampaigns(true);
      try {
        const aid = getEntityId(selectedAdvertiser);
        const response = await fetch(`/api/campaigns?advertiser_id=${aid}`);
        if (response.ok) {
          const data = await response.json();
          setCampaigns(data.campaigns || []);
        }
      } catch (error) {
        console.error('Failed to load campaigns:', error);
      } finally {
        setIsLoadingCampaigns(false);
      }
    };

    loadCampaigns();
  }, [selectedAdvertiser]);

  // Persist to localStorage when selections change
  useEffect(() => {
    if (selectedNetwork) {
      localStorage.setItem(STORAGE_KEYS.NETWORK, JSON.stringify(selectedNetwork));
    } else {
      localStorage.removeItem(STORAGE_KEYS.NETWORK);
    }
  }, [selectedNetwork]);

  useEffect(() => {
    if (selectedAdvertiser) {
      localStorage.setItem(STORAGE_KEYS.ADVERTISER, JSON.stringify(selectedAdvertiser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADVERTISER);
    }
  }, [selectedAdvertiser]);

  useEffect(() => {
    if (selectedCampaign) {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGN, JSON.stringify(selectedCampaign));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CAMPAIGN);
    }
  }, [selectedCampaign]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_ZONES, JSON.stringify(selectedZones));
  }, [selectedZones]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOW_ONLY_SELECTED, JSON.stringify(showOnlySelected));
  }, [showOnlySelected]);

  useEffect(() => {
    if (selectedTheme) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_THEME, JSON.stringify(selectedTheme));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_THEME);
    }
  }, [selectedTheme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_ADVERTISEMENTS, JSON.stringify(selectedAdvertisements));
  }, [selectedAdvertisements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOW_ONLY_SELECTED_ADS, JSON.stringify(showOnlySelectedAds));
  }, [showOnlySelectedAds]);

  // Clear functions
  const clearAllFilters = () => {
    // Preserve selected network unless the user explicitly changes it
    setSelectedAdvertiser(null);
    setSelectedCampaign(null);
    setSelectedZones([]);
    setShowOnlySelected(false);
    setSelectedTheme(null);
    setSelectedAdvertisements([]);
    setShowOnlySelectedAds(false);
    // Keep network persisted; only clear dependent filters
    localStorage.removeItem(STORAGE_KEYS.ADVERTISER);
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGN);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_ZONES);
    localStorage.removeItem(STORAGE_KEYS.SHOW_ONLY_SELECTED);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_THEME);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_ADVERTISEMENTS);
    localStorage.removeItem(STORAGE_KEYS.SHOW_ONLY_SELECTED_ADS);
  };

  // Zone selection actions
  const selectZones = (zoneIds: string[]) => {
    setSelectedZones(prev => {
      const newSelection = [...new Set([...prev, ...zoneIds])];
      return newSelection;
    });
  };

  const deselectZones = (zoneIds: string[]) => {
    setSelectedZones(prev => prev.filter(currentZoneId => !zoneIds.includes(currentZoneId)));
  };

  const toggleZoneSelection = (zoneId: string) => {
    setSelectedZones(prev =>
      prev.includes(zoneId)
        ? prev.filter(currentZoneId => currentZoneId !== zoneId)
        : [...prev, zoneId]
    );
  };

  // Advertisement selection actions
  const selectAdvertisements = (advertisementIds: string[]) => {
    setSelectedAdvertisements(prev => {
      const newSelection = [...new Set([...prev, ...advertisementIds])];
      return newSelection;
    });
  };

  const deselectAdvertisements = (advertisementIds: string[]) => {
    setSelectedAdvertisements(prev => prev.filter(currentAdId => !advertisementIds.includes(currentAdId)));
  };

  const toggleAdvertisementSelection = (advertisementId: string) => {
    setSelectedAdvertisements(prev =>
      prev.includes(advertisementId)
        ? prev.filter(currentAdId => currentAdId !== advertisementId)
        : [...prev, advertisementId]
    );
  };

  // Theme selection function that replaces current zone selection
  const selectThemeZones = (theme: { _id: string; name: string; zone_ids: number[] } | null) => {
    if (theme) {
      // Clear current zone selection and select all zones from the theme
      const themeZoneIds = theme.zone_ids.map(id => String(id));
      setSelectedZones(themeZoneIds);
      setSelectedTheme(theme);
      setShowOnlySelected(true); // Automatically show only selected zones
    } else {
      // Clear theme selection
      setSelectedTheme(null);
    }
  };

  const value = useMemo<FilterContextType>(() => ({
    selectedNetwork,
    selectedAdvertiser,
    selectedCampaign,
    selectedZones,
    showOnlySelected,
    selectedTheme,
    selectedAdvertisements,
    showOnlySelectedAds,
    setSelectedNetwork,
    setSelectedAdvertiser,
    setSelectedCampaign,
    setSelectedZones,
    setShowOnlySelected,
    setSelectedTheme,
    setSelectedAdvertisements,
    setShowOnlySelectedAds,
    networks,
    advertisers,
    campaigns,
    setNetworks,
    setAdvertisers,
    setCampaigns,
    isLoadingNetworks,
    isLoadingAdvertisers,
    isLoadingCampaigns,
    setIsLoadingNetworks,
    setIsLoadingAdvertisers,
    setIsLoadingCampaigns,
    clearAllFilters,
    selectZones,
    deselectZones,
    toggleZoneSelection,
    selectThemeZones,
    selectAdvertisements,
    deselectAdvertisements,
    toggleAdvertisementSelection,
  }), [
    selectedNetwork,
    selectedAdvertiser,
    selectedCampaign,
    selectedZones,
    showOnlySelected,
    selectedTheme,
    selectedAdvertisements,
    showOnlySelectedAds,
    networks,
    advertisers,
    campaigns,
    isLoadingNetworks,
    isLoadingAdvertisers,
    isLoadingCampaigns,
  ]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

// Dev-only deprecation warnings when directly accessing selected entities via useFilters
const __warnedKeys: Record<string, boolean> = { selectedNetwork: false, selectedAdvertiser: false, selectedCampaign: false };

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }

  if (process.env.NODE_ENV === 'development') {
    const handler: ProxyHandler<FilterContextType> = {
      get(target, prop, receiver) {
        if (
          (prop === 'selectedNetwork' || prop === 'selectedAdvertiser' || prop === 'selectedCampaign') &&
          !__warnedKeys[String(prop)]
        ) {
          __warnedKeys[String(prop)] = true;
          // Deprecated access warning removed for production
        }
        return Reflect.get(target, prop, receiver);
      },
    };
    return new Proxy(context, handler) as FilterContextType;
  }

  return context;
}
