'use client';

import { useState, useEffect } from 'react';
import { Network, Advertiser, Campaign, Advertisement, Zone, ZoneSize } from '@/lib/types/broadstreet';

interface FallbackAdWizardProps {
  onClose: () => void;
}

interface WizardState {
  step: number;
  selectedNetwork: Network | null;
  selectedAdvertiser: Advertiser | null;
  selectedCampaign: Campaign | null;
  selectedAdvertisements: Advertisement[];
  selectedSizes: ZoneSize[];
  matchedZones: Zone[];
  isLoading: boolean;
  error: string | null;
}

export default function FallbackAdWizard({ onClose }: FallbackAdWizardProps) {
  const [state, setState] = useState<WizardState>({
    step: 1,
    selectedNetwork: null,
    selectedAdvertiser: null,
    selectedCampaign: null,
    selectedAdvertisements: [],
    selectedSizes: [],
    matchedZones: [],
    isLoading: false,
    error: null,
  });

  const [networks, setNetworks] = useState<Network[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);

  // Load networks on mount
  useEffect(() => {
    fetchNetworks();
  }, []);

  const fetchNetworks = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await fetch('/api/fallback-ad/networks');
      const data = await response.json();
      if (data.success) {
        setNetworks(data.networks);
      } else {
        setState(prev => ({ ...prev, error: data.message }));
      }
    } catch {
      setState(prev => ({ ...prev, error: 'Failed to load networks' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const fetchAdvertisers = async (networkId: number) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await fetch(`/api/fallback-ad/advertisers?networkId=${networkId}`);
      const data = await response.json();
      if (data.success) {
        setAdvertisers(data.advertisers);
      } else {
        setState(prev => ({ ...prev, error: data.message }));
      }
    } catch {
      setState(prev => ({ ...prev, error: 'Failed to load advertisers' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const fetchCampaigns = async (advertiserId: number) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await fetch(`/api/fallback-ad/campaigns?advertiserId=${advertiserId}`);
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      } else {
        setState(prev => ({ ...prev, error: data.message }));
      }
    } catch {
      setState(prev => ({ ...prev, error: 'Failed to load campaigns' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const fetchAdvertisements = async (networkId: number, advertiserId: number) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await fetch(`/api/fallback-ad/advertisements?networkId=${networkId}&advertiserId=${advertiserId}`);
      const data = await response.json();
      if (data.success) {
        setAdvertisements(data.advertisements);
      } else {
        setState(prev => ({ ...prev, error: data.message }));
      }
    } catch {
      setState(prev => ({ ...prev, error: 'Failed to load advertisements' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const previewZones = async (networkId: number, sizes: ZoneSize[]) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await fetch('/api/fallback-ad/preview-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ networkId, sizes }),
      });
      const data = await response.json();
      if (data.success) {
        setState(prev => ({ ...prev, matchedZones: data.zones }));
      } else {
        setState(prev => ({ ...prev, error: data.message }));
      }
    } catch {
      setState(prev => ({ ...prev, error: 'Failed to preview zones' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const createPlacements = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await fetch('/api/fallback-ad/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          networkId: state.selectedNetwork!.id,
          advertiserId: state.selectedAdvertiser!.id,
          campaignId: state.selectedCampaign!.id,
          advertisementIds: state.selectedAdvertisements.map(ad => ad.id),
          sizes: state.selectedSizes,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`Successfully created ${data.placementsCreated} placements!`);
        onClose();
      } else {
        setState(prev => ({ ...prev, error: data.message }));
      }
    } catch {
      setState(prev => ({ ...prev, error: 'Failed to create placements' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleNetworkSelect = (network: Network) => {
    setState(prev => ({
      ...prev,
      selectedNetwork: network,
      selectedAdvertiser: null,
      selectedCampaign: null,
      selectedAdvertisements: [],
      selectedSizes: [],
      matchedZones: [],
    }));
    fetchAdvertisers(network.id);
  };

  const handleAdvertiserSelect = (advertiser: Advertiser) => {
    setState(prev => ({
      ...prev,
      selectedAdvertiser: advertiser,
      selectedCampaign: null,
      selectedAdvertisements: [],
      selectedSizes: [],
      matchedZones: [],
    }));
    fetchCampaigns(advertiser.id);
  };

  const handleCampaignSelect = (campaign: Campaign) => {
    setState(prev => ({
      ...prev,
      selectedCampaign: campaign,
      selectedAdvertisements: [],
      selectedSizes: [],
      matchedZones: [],
    }));
    fetchAdvertisements(state.selectedNetwork!.id, state.selectedAdvertiser!.id);
  };

  const handleAdvertisementToggle = (advertisement: Advertisement) => {
    setState(prev => ({
      ...prev,
      selectedAdvertisements: prev.selectedAdvertisements.some(ad => ad.id === advertisement.id)
        ? prev.selectedAdvertisements.filter(ad => ad.id !== advertisement.id)
        : [...prev.selectedAdvertisements, advertisement],
    }));
  };

  const handleSizeToggle = (size: ZoneSize) => {
    const newSizes = state.selectedSizes.includes(size)
      ? state.selectedSizes.filter(s => s !== size)
      : [...state.selectedSizes, size];
    
    setState(prev => ({ ...prev, selectedSizes: newSizes }));
    
    if (newSizes.length > 0 && state.selectedNetwork) {
      previewZones(state.selectedNetwork.id, newSizes);
    } else {
      setState(prev => ({ ...prev, matchedZones: [] }));
    }
  };

  const canProceedToNext = () => {
    switch (state.step) {
      case 1: return state.selectedNetwork !== null;
      case 2: return state.selectedAdvertiser !== null;
      case 3: return state.selectedCampaign !== null;
      case 4: return state.selectedAdvertisements.length > 0;
      case 5: return state.selectedSizes.length > 0;
      default: return false;
    }
  };

  const nextStep = () => {
    if (canProceedToNext()) {
      setState(prev => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const prevStep = () => {
    setState(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Fallback Ad</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= state.step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 6 && (
                    <div className={`w-12 h-1 mx-2 ${
                      step < state.step ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Network</span>
              <span>Advertiser</span>
              <span>Campaign</span>
              <span>Ads</span>
              <span>Sizes</span>
              <span>Confirm</span>
            </div>
          </div>

          {state.error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{state.error}</p>
            </div>
          )}

          {state.isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Step 1: Network Selection */}
          {state.step === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Network</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {networks.map((network) => (
                  <div
                    key={network.id}
                    onClick={() => handleNetworkSelect(network)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      state.selectedNetwork?.id === network.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {network.logo?.url && (
                        <img
                          src={network.logo.url}
                          alt={`${network.name} logo`}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">{network.name}</h4>
                        <p className="text-sm text-gray-600">
                          {network.advertiser_count || 0} advertisers, {network.zone_count || 0} zones
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Advertiser Selection */}
          {state.step === 2 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Advertiser</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {advertisers.map((advertiser) => (
                  <div
                    key={advertiser.id}
                    onClick={() => handleAdvertiserSelect(advertiser)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      state.selectedAdvertiser?.id === advertiser.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {advertiser.logo?.url && (
                        <img
                          src={advertiser.logo.url}
                          alt={`${advertiser.name} logo`}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">{advertiser.name}</h4>
                        {advertiser.web_home_url && (
                          <p className="text-sm text-gray-600">{advertiser.web_home_url}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Campaign Selection */}
          {state.step === 3 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Campaign</h3>
              <div className="grid grid-cols-1 gap-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    onClick={() => handleCampaignSelect(campaign)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      state.selectedCampaign?.id === campaign.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(campaign.start_date).toLocaleDateString()} -
                          {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'No end date'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        campaign.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Advertisement Selection */}
          {state.step === 4 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Advertisements</h3>
              <p className="text-sm text-gray-600 mb-4">Select one or more advertisements to include in the fallback placements.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {advertisements.map((advertisement) => (
                  <div
                    key={advertisement.id}
                    onClick={() => handleAdvertisementToggle(advertisement)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      state.selectedAdvertisements.some(ad => ad.id === advertisement.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{advertisement.name}</h4>
                        <p className="text-sm text-gray-600">Type: {advertisement.type}</p>
                        <p className="text-sm text-gray-600">Advertiser: {advertisement.advertiser}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {state.selectedAdvertisements.some(ad => ad.id === advertisement.id) && (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          advertisement.active_placement ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {advertisement.active_placement ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {state.selectedAdvertisements.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Selected {state.selectedAdvertisements.length} advertisement{state.selectedAdvertisements.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Size Selection */}
          {state.step === 5 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Ad Sizes</h3>
              <p className="text-sm text-gray-600 mb-4">Select the ad sizes to create fallback placements for.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {(['SQ', 'PT', 'LS'] as ZoneSize[]).map((size) => {
                  const sizeInfo = {
                    SQ: { name: 'Square', dimensions: '300x250px', description: 'Square ads' },
                    PT: { name: 'Portrait', dimensions: '300x600px', description: 'Vertical banners' },
                    LS: { name: 'Landscape', dimensions: '728x90px', description: 'Horizontal banners' },
                  }[size];

                  return (
                    <div
                      key={size}
                      onClick={() => handleSizeToggle(size)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        state.selectedSizes.includes(size)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center text-white font-bold ${
                          state.selectedSizes.includes(size) ? 'bg-blue-600' : 'bg-gray-400'
                        }`}>
                          {size}
                        </div>
                        <h4 className="font-medium text-gray-900">{sizeInfo.name}</h4>
                        <p className="text-sm text-gray-600">{sizeInfo.dimensions}</p>
                        <p className="text-xs text-gray-500">{sizeInfo.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {state.matchedZones.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Matched Zones ({state.matchedZones.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {state.matchedZones.map((zone) => (
                        <div key={zone.id} className="text-sm text-gray-700 bg-white p-2 rounded">
                          {zone.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Confirmation */}
          {state.step === 6 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Fallback Ad Creation</h3>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium">Network:</span> {state.selectedNetwork?.name}</p>
                      <p><span className="font-medium">Advertiser:</span> {state.selectedAdvertiser?.name}</p>
                      <p><span className="font-medium">Campaign:</span> {state.selectedCampaign?.name}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Advertisements:</span> {state.selectedAdvertisements.length}</p>
                      <p><span className="font-medium">Sizes:</span> {state.selectedSizes.join(', ')}</p>
                      <p><span className="font-medium">Zones:</span> {state.matchedZones.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Placements to Create</h4>
                  <p className="text-sm text-blue-800">
                    This will create <strong>{state.selectedAdvertisements.length * state.matchedZones.length}</strong> placements
                    ({state.selectedAdvertisements.length} advertisements × {state.matchedZones.length} zones)
                  </p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Important</h4>
                  <p className="text-sm text-yellow-800">
                    This action will create placements in the Broadstreet system. Make sure all selections are correct before proceeding.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={prevStep}
            disabled={state.step === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-3">
            {state.step < 6 ? (
              <button
                onClick={nextStep}
                disabled={!canProceedToNext() || state.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={createPlacements}
                disabled={state.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Placements
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
