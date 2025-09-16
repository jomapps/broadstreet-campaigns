'use client';

import { useFilters } from '@/contexts/FilterContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Filter } from 'lucide-react';
import { getEntityId } from '@/lib/utils/entity-helpers';

export default function FiltersCard() {
  const {
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
    isLoadingNetworks,
    isLoadingAdvertisers,
    isLoadingCampaigns,
    clearAllFilters,
  } = useFilters();

  const hasAnyFilter = selectedNetwork || selectedAdvertiser || selectedCampaign;
  const hasZoneSelection = selectedZones.length > 0;
  const hasAdvertisementSelection = selectedAdvertisements.length > 0;

  // Utility function to clean network names for display
  const cleanNetworkName = (name: string) => {
    return name.replace('FASH Medien Verlag GmbH', '').trim();
  };

  return (
    <Card className="bg-sidebar-accent/50 border-sidebar-border">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sidebar-foreground text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </div>
          {hasAnyFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 w-6 p-0 text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {/* Network Filter */}
        <div className="space-y-2">
          <div className="text-xs text-sidebar-foreground/70">Network</div>
          {isLoadingNetworks ? (
            <div className="h-8 bg-sidebar-accent/30 rounded-md animate-pulse"></div>
          ) : (
            <Select
              value={getEntityId(selectedNetwork)?.toString() || ''}
              onValueChange={(value) => {
                const network = networks.find(n => getEntityId(n)?.toString() === value);
                setSelectedNetwork(network || null);
                // Clear dependent filters when network changes
                const oldId = getEntityId(selectedNetwork);
                const newId = getEntityId(network);
                if (newId !== oldId) {
                  setSelectedAdvertiser(null);
                  setSelectedCampaign(null);
                }
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-sidebar-accent/30 border-sidebar-border hover:bg-sidebar-accent/50 focus:ring-sidebar-accent">
                <SelectValue placeholder="Select network">
                  {selectedNetwork && (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs truncate max-w-[140px]" title={selectedNetwork.name}>
                        {cleanNetworkName(selectedNetwork.name)}
                      </span>
                      {selectedNetwork.valet_active && (
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-4">
                          Valet
                        </Badge>
                      )}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {networks.map((network) => (
                  <SelectItem
                    key={getEntityId(network)}
                    value={getEntityId(network)?.toString() || ''}
                    className="text-xs"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate max-w-[200px]" title={network.name}>
                        {cleanNetworkName(network.name)}
                      </span>
                      {network.valet_active && (
                        <Badge variant="secondary" className="ml-2 text-[10px] px-1 py-0 h-4">
                          Valet
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Advertiser Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-sidebar-foreground/70">Advertiser</div>
            {selectedAdvertiser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedAdvertiser(null); setSelectedCampaign(null); }}
                className="h-4 w-4 p-0 text-sidebar-foreground/50 hover:text-sidebar-foreground"
              >
                <X className="h-2 w-2" />
              </Button>
            )}
          </div>
          {!selectedNetwork ? (
            <div className="h-8 bg-sidebar-accent/20 rounded-md flex items-center justify-center">
              <span className="text-xs text-sidebar-foreground/50">Select network first</span>
            </div>
          ) : isLoadingAdvertisers ? (
            <div className="h-8 bg-sidebar-accent/30 rounded-md animate-pulse"></div>
          ) : selectedAdvertiser ? (
            <div className="h-8 bg-sidebar-accent/30 rounded-md flex items-center justify-between px-3">
              <span className="text-xs truncate max-w-[140px]" title={selectedAdvertiser.name}>
                {selectedAdvertiser.name}
              </span>
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                Selected
              </Badge>
            </div>
          ) : (
            <div className="h-8 bg-sidebar-accent/20 rounded-md flex items-center justify-center">
              <span className="text-xs text-sidebar-foreground/50">
                {advertisers.length === 0 ? 'No advertisers' : 'Select on advertisers page'}
              </span>
            </div>
          )}
        </div>

        {/* Campaign Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-sidebar-foreground/70">Campaign</div>
            {selectedCampaign && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCampaign(null)}
                className="h-4 w-4 p-0 text-sidebar-foreground/50 hover:text-sidebar-foreground"
              >
                <X className="h-2 w-2" />
              </Button>
            )}
          </div>
          {!selectedAdvertiser ? (
            <div className="h-8 bg-sidebar-accent/20 rounded-md flex items-center justify-center">
              <span className="text-xs text-sidebar-foreground/50">Select advertiser first</span>
            </div>
          ) : isLoadingCampaigns ? (
            <div className="h-8 bg-sidebar-accent/30 rounded-md animate-pulse"></div>
          ) : selectedCampaign ? (
            <div className="h-8 bg-sidebar-accent/30 rounded-md flex items-center justify-between px-3">
              <span className="text-xs truncate max-w-[140px]" title={selectedCampaign.name}>
                {selectedCampaign.name}
              </span>
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                Selected
              </Badge>
            </div>
          ) : (
            <div className="h-8 bg-sidebar-accent/20 rounded-md flex items-center justify-center">
              <span className="text-xs text-sidebar-foreground/50">
                {campaigns.length === 0 ? 'No campaigns' : 'Select on campaigns page'}
              </span>
            </div>
          )}
        </div>

        {/* Zone Selection Indicator */}
        {hasZoneSelection && (
          <div className="space-y-2 pt-3 border-t border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="text-xs text-sidebar-foreground/70">Selected Zones</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedZones([]); setShowOnlySelected(false); }}
                className="h-4 w-4 p-0 text-sidebar-foreground/50 hover:text-sidebar-foreground"
              >
                <X className="h-2 w-2" />
              </Button>
            </div>
            <div className="h-8 bg-sidebar-accent/30 rounded-md flex items-center justify-between px-3">
              <span className="text-xs truncate max-w-[140px]">
                {selectedZones.length} zone{selectedZones.length !== 1 ? 's' : ''} selected
              </span>
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                {showOnlySelected ? 'Filtered' : 'All'}
              </Badge>
            </div>
          </div>
        )}

        {/* Advertisement Selection Indicator */}
        {hasAdvertisementSelection && (
          <div className="space-y-2 pt-3 border-t border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="text-xs text-sidebar-foreground/70">Selected Advertisements</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedAdvertisements([]); setShowOnlySelectedAds(false); }}
                className="h-4 w-4 p-0 text-sidebar-foreground/50 hover:text-sidebar-foreground"
              >
                <X className="h-2 w-2" />
              </Button>
            </div>
            <div className="h-8 bg-sidebar-accent/30 rounded-md flex items-center justify-between px-3">
              <span className="text-xs truncate max-w-[140px]">
                {selectedAdvertisements.length} ad{selectedAdvertisements.length !== 1 ? 's' : ''} selected
              </span>
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                {showOnlySelectedAds ? 'Filtered' : 'All'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
