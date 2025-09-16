'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Network, Advertiser, Campaign } from '@/lib/types/broadstreet';

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
  
  // Advertisement selection
  selectedAdvertisements: string[]; // Array of advertisement IDs
  showOnlySelectedAds: boolean;
  
  // Setters
  setSelectedNetwork: (network: any | null) => void;
  setSelectedAdvertiser: (advertiser: any | null) => void;
  setSelectedCampaign: (campaign: any | null) => void;
  setSelectedZones: (zones: string[]) => void;
  setShowOnlySelected: (show: boolean) => void;
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
  SELECTED_ADVERTISEMENTS: 'broadstreet_selected_advertisements',
  SHOW_ONLY_SELECTED_ADS: 'broadstreet_show_only_selected_ads',
};

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<Advertiser | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [showOnlySelected, setShowOnlySelected] = useState<boolean>(false);
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
        const storedSelectedAdvertisements = localStorage.getItem(STORAGE_KEYS.SELECTED_ADVERTISEMENTS);
        const storedShowOnlySelectedAds = localStorage.getItem(STORAGE_KEYS.SHOW_ONLY_SELECTED_ADS);
        
        if (storedNetwork) {
          setSelectedNetwork(JSON.parse(storedNetwork));
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
          
          // Set first network as default if none selected
          if (!selectedNetwork && data.networks && data.networks.length > 0) {
            setSelectedNetwork(data.networks[0]);
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
        const nid = (selectedNetwork as any).broadstreet_id ?? (selectedNetwork as any).id;
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
        const aid = (selectedAdvertiser as any).broadstreet_id ?? (selectedAdvertiser as any).id;
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
    localStorage.setItem(STORAGE_KEYS.SELECTED_ADVERTISEMENTS, JSON.stringify(selectedAdvertisements));
  }, [selectedAdvertisements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOW_ONLY_SELECTED_ADS, JSON.stringify(showOnlySelectedAds));
  }, [showOnlySelectedAds]);

  // Clear functions
  const clearAllFilters = () => {
    setSelectedNetwork(null);
    setSelectedAdvertiser(null);
    setSelectedCampaign(null);
    setSelectedZones([]);
    setShowOnlySelected(false);
    setSelectedAdvertisements([]);
    setShowOnlySelectedAds(false);
    localStorage.removeItem(STORAGE_KEYS.NETWORK);
    localStorage.removeItem(STORAGE_KEYS.ADVERTISER);
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGN);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_ZONES);
    localStorage.removeItem(STORAGE_KEYS.SHOW_ONLY_SELECTED);
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
    setSelectedZones(prev => prev.filter(id => !zoneIds.includes(id)));
  };

  const toggleZoneSelection = (zoneId: string) => {
    setSelectedZones(prev => 
      prev.includes(zoneId) 
        ? prev.filter(id => id !== zoneId)
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
    setSelectedAdvertisements(prev => prev.filter(id => !advertisementIds.includes(id)));
  };

  const toggleAdvertisementSelection = (advertisementId: string) => {
    setSelectedAdvertisements(prev => 
      prev.includes(advertisementId) 
        ? prev.filter(id => id !== advertisementId)
        : [...prev, advertisementId]
    );
  };

  const value = useMemo<FilterContextType>(() => ({
    selectedNetwork,
    selectedAdvertiser,
    selectedCampaign,
    selectedZones,
    showOnlySelected,
    selectedAdvertisements,
    showOnlySelectedAds,
    setSelectedNetwork,
    setSelectedAdvertiser,
    setSelectedCampaign,
    setSelectedZones,
    setShowOnlySelected,
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
    selectAdvertisements,
    deselectAdvertisements,
    toggleAdvertisementSelection,
  }), [
    selectedNetwork,
    selectedAdvertiser,
    selectedCampaign,
    selectedZones,
    showOnlySelected,
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
