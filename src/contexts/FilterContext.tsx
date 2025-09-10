'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Network, Advertiser, Campaign } from '@/lib/types/broadstreet';

interface FilterContextType {
  // Selected filters
  selectedNetwork: Network | null;
  selectedAdvertiser: Advertiser | null;
  selectedCampaign: Campaign | null;
  
  // Setters
  setSelectedNetwork: (network: Network | null) => void;
  setSelectedAdvertiser: (advertiser: Advertiser | null) => void;
  setSelectedCampaign: (campaign: Campaign | null) => void;
  
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
  clearAdvertiserFilter: () => void;
  clearCampaignFilter: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const STORAGE_KEYS = {
  NETWORK: 'broadstreet_selected_network',
  ADVERTISER: 'broadstreet_selected_advertiser',
  CAMPAIGN: 'broadstreet_selected_campaign',
};

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<Advertiser | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  
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
        
        if (storedNetwork) {
          setSelectedNetwork(JSON.parse(storedNetwork));
        }
        if (storedAdvertiser) {
          setSelectedAdvertiser(JSON.parse(storedAdvertiser));
        }
        if (storedCampaign) {
          setSelectedCampaign(JSON.parse(storedCampaign));
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
        const response = await fetch(`/api/advertisers?network_id=${selectedNetwork.id}`);
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
        const response = await fetch(`/api/campaigns?advertiser_id=${selectedAdvertiser.id}`);
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

  // Clear functions
  const clearAllFilters = () => {
    setSelectedNetwork(null);
    setSelectedAdvertiser(null);
    setSelectedCampaign(null);
    localStorage.removeItem(STORAGE_KEYS.NETWORK);
    localStorage.removeItem(STORAGE_KEYS.ADVERTISER);
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGN);
  };

  const clearAdvertiserFilter = () => {
    setSelectedAdvertiser(null);
    setSelectedCampaign(null);
    localStorage.removeItem(STORAGE_KEYS.ADVERTISER);
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGN);
  };

  const clearCampaignFilter = () => {
    setSelectedCampaign(null);
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGN);
  };

  return (
    <FilterContext.Provider
      value={{
        selectedNetwork,
        selectedAdvertiser,
        selectedCampaign,
        setSelectedNetwork,
        setSelectedAdvertiser,
        setSelectedCampaign,
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
        clearAdvertiserFilter,
        clearCampaignFilter,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
