/**
 * PAGINATED PLACEMENT SECTION COMPONENT
 * 
 * Specialized paginated section for placements (both embedded and standalone).
 * Handles the complex placement display logic with pagination support.
 * Variable names follow docs/variable-origins.md registry.
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';
import { usePaginatedEntities, PaginatedEntityConfig } from '@/lib/hooks/use-paginated-entities';
import { Trash2 } from 'lucide-react';

// Local entity data type
type LocalOnlyData = {
  zones: any[];
  advertisers: any[];
  campaigns: any[];
  networks: any[];
  advertisements: any[];
  placements: any[];
};

// Props for embedded placement cards
interface EmbeddedPlacementCardProps {
  placement: any;
  campaign: any;
  networkMap: Record<number, string>;
  advertiserMap: Record<number, string>;
  allLocalEntities: LocalOnlyData;
}

// Props for local placement cards
interface LocalPlacementCardProps {
  placement: any;
  networkMap: Record<number, string>;
  advertiserMap: Record<number, string>;
  allLocalEntities: LocalOnlyData;
  onDelete: (entityId: string) => void;
}

// Embedded Placement Card Component
function EmbeddedPlacementCard({
  placement,
  campaign,
  networkMap,
  advertiserMap,
  allLocalEntities
}: EmbeddedPlacementCardProps) {
  // Find related entities from local data
  const advertiser = advertiserMap[campaign.advertiser_id];

  // Find advertisement entity
  const advertisement = allLocalEntities.advertisements.find(ad =>
    ad.broadstreet_id === placement.advertisement_id
  );

  // Find zone entity
  const zone = placement.zone_id
    ? allLocalEntities.zones.find(z => z.broadstreet_id === placement.zone_id)
    : placement.zone_mongo_id
      ? allLocalEntities.zones.find(z => z._id === placement.zone_mongo_id)
      : null;

  // Build breadcrumb hierarchy
  const parentsBreadcrumb = [
    {
      name: networkMap[campaign.network_id] || `Network ${campaign.network_id}`,
      broadstreet_id: campaign.network_id,
      mongo_id: undefined,
      entityType: 'network' as const,
    },
    {
      name: advertiser || `Advertiser ${campaign.advertiser_id}`,
      broadstreet_id: campaign.advertiser_id,
      mongo_id: undefined,
      entityType: 'advertiser' as const,
    },
    {
      name: campaign.name,
      broadstreet_id: campaign.broadstreet_id,
      mongo_id: campaign._id,
      entityType: 'campaign' as const,
    },
    advertisement && {
      name: advertisement.name,
      broadstreet_id: advertisement.broadstreet_id,
      mongo_id: advertisement._id,
      entityType: 'advertisement' as const,
    },
    zone && {
      name: zone.name,
      broadstreet_id: zone.broadstreet_id,
      mongo_id: zone._id,
      entityType: 'zone' as const,
    },
  ].filter(Boolean) as any[];

  // Display data for the card content
  const displayData = [
    { label: 'Campaign', value: campaign.name, type: 'string' as const },
    { label: 'Advertisement', value: advertisement?.name ?? String(placement.advertisement_id), type: 'string' as const },
    { label: 'Zone', value: zone?.name ?? (placement.zone_id ? `Zone ${placement.zone_id}` : placement.zone_mongo_id ? `Zone ${placement.zone_mongo_id}` : 'N/A'), type: 'string' as const },
  ] as any[];

  if (placement.restrictions && placement.restrictions.length > 0) {
    displayData.push({ label: 'Restrictions', value: placement.restrictions.join(', '), type: 'string' as const });
  }

  return (
    <UniversalEntityCard
      title={advertisement?.name || `Advertisement ${placement.advertisement_id}`}
      entityType="placement"
      isLocal={true}
      parentsBreadcrumb={parentsBreadcrumb}
      displayData={displayData}
      topTags={[{ label: 'embedded', variant: 'secondary' as const }]}
    />
  );
}

// Local Placement Card Component
function LocalPlacementCard({
  placement,
  networkMap,
  advertiserMap,
  allLocalEntities,
  onDelete
}: LocalPlacementCardProps) {
  // Find related entities from local data
  const advertiser = advertiserMap[placement.advertiser_id];

  // Find campaign entity
  const campaign = placement.campaign_id
    ? allLocalEntities.campaigns.find(c => c.broadstreet_id === placement.campaign_id)
    : placement.campaign_mongo_id
      ? allLocalEntities.campaigns.find(c => c._id === placement.campaign_mongo_id)
      : null;

  // Find advertisement entity
  const advertisement = allLocalEntities.advertisements.find(ad =>
    ad.broadstreet_id === placement.advertisement_id
  );

  // Find zone entity
  const zone = placement.zone_id
    ? allLocalEntities.zones.find(z => z.broadstreet_id === placement.zone_id)
    : placement.zone_mongo_id
      ? allLocalEntities.zones.find(z => z._id === placement.zone_mongo_id)
      : null;

  // Build breadcrumb hierarchy
  const parentsBreadcrumb = [
    {
      name: networkMap[placement.network_id] || `Network ${placement.network_id}`,
      broadstreet_id: placement.network_id,
      mongo_id: undefined,
      entityType: 'network' as const,
    },
    {
      name: advertiser || `Advertiser ${placement.advertiser_id}`,
      broadstreet_id: placement.advertiser_id,
      mongo_id: undefined,
      entityType: 'advertiser' as const,
    },
    campaign && {
      name: campaign.name,
      broadstreet_id: campaign.broadstreet_id,
      mongo_id: campaign._id,
      entityType: 'campaign' as const,
    },
    advertisement && {
      name: advertisement.name,
      broadstreet_id: advertisement.broadstreet_id,
      mongo_id: advertisement._id,
      entityType: 'advertisement' as const,
    },
    zone && {
      name: zone.name,
      broadstreet_id: zone.broadstreet_id,
      mongo_id: zone._id,
      entityType: 'zone' as const,
    },
  ].filter(Boolean) as any[];

  // Display data for the card content
  const displayData = [
    { label: 'Campaign', value: campaign?.name ?? (placement.campaign_id ? `Campaign ${placement.campaign_id}` : 'N/A'), type: 'string' as const },
    { label: 'Advertisement', value: advertisement?.name ?? String(placement.advertisement_id), type: 'string' as const },
    { label: 'Zone', value: zone?.name ?? (placement.zone_id ? `Zone ${placement.zone_id}` : 'N/A'), type: 'string' as const },
  ] as any[];

  if (placement.restrictions && placement.restrictions.length > 0) {
    displayData.push({ label: 'Restrictions', value: placement.restrictions.join(', '), type: 'string' as const });
  }

  return (
    <UniversalEntityCard
      title={advertisement?.name || `Advertisement ${placement.advertisement_id}`}
      entityType="placement"
      isLocal={true}
      mongo_id={placement._id}
      parentsBreadcrumb={parentsBreadcrumb}
      displayData={displayData}
      onDelete={() => onDelete(placement._id)}
    />
  );
}

// Props for the paginated placement section
interface PaginatedPlacementSectionProps {
  title: string;
  placements: any[];
  campaigns?: any[];
  networkMap: Record<number, string>;
  advertiserMap: Record<number, string>;
  allLocalEntities: LocalOnlyData;
  onDelete?: (entityId: string) => void;
  onDeleteSection?: () => void;
  isDeletingSection?: boolean;
  paginationConfig?: PaginatedEntityConfig;
  isEmbedded?: boolean;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  badgeColor?: string;
}

export default function PaginatedPlacementSection({
  title,
  placements,
  campaigns = [],
  networkMap,
  advertiserMap,
  allLocalEntities,
  onDelete,
  onDeleteSection,
  isDeletingSection,
  paginationConfig = { itemsPerPage: 20, enablePagination: true },
  isEmbedded = false,
  badgeVariant = 'outline',
  badgeColor,
}: PaginatedPlacementSectionProps) {
  // For embedded placements, flatten the campaign placements
  const allPlacements = isEmbedded 
    ? campaigns.flatMap((c: any) => (c.placements || []).map((p: any, idx: number) => ({
        ...p,
        _campaign: c,
        _key: `${c._id}-${p.advertisement_id}-${p.zone_id || p.zone_mongo_id || idx}`
      })))
    : placements;

  // Use pagination hook
  const {
    displayedItems,
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems,
    goToPage,
    changeItemsPerPage,
    paginationInfo,
  } = usePaginatedEntities(allPlacements, paginationConfig);

  // Don't render if no placements
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center space-x-3">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <Badge variant="outline" className="text-sm">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </Badge>
        {paginationConfig.enablePagination && totalItems > paginationConfig.itemsPerPage! && (
          <Badge variant="secondary" className="text-xs">
            Page {currentPage} of {totalPages}
          </Badge>
        )}
        <Badge variant={badgeVariant} className={`text-xs ${badgeColor}`}>
          {isEmbedded ? 'In Campaigns' : 'Collection'}
        </Badge>
        {onDeleteSection && (
          <Button
            onClick={onDeleteSection}
            disabled={isDeletingSection}
            variant="destructive"
            size="sm"
            className="h-6 px-2 text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            {isDeletingSection ? 'Deleting...' : 'Delete All Placements'}
          </Button>
        )}
      </div>

      {/* Pagination Info */}
      {paginationConfig.enablePagination && totalItems > paginationConfig.itemsPerPage! && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Showing {paginationInfo.showing}</span>
          <span className="text-xs">
            Operations work on all {totalItems} placements
          </span>
        </div>
      )}

      {/* Placement Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedItems.map((placement) => (
          isEmbedded ? (
            <EmbeddedPlacementCard
              key={placement._key}
              placement={placement}
              campaign={placement._campaign}
              networkMap={networkMap}
              advertiserMap={advertiserMap}
              allLocalEntities={allLocalEntities}
            />
          ) : (
            <LocalPlacementCard
              key={placement._id}
              placement={placement}
              networkMap={networkMap}
              advertiserMap={advertiserMap}
              allLocalEntities={allLocalEntities}
              onDelete={onDelete!}
            />
          )
        ))}
      </div>

      {/* Pagination Controls */}
      {paginationConfig.enablePagination && totalPages > 1 && (
        <div className="pt-4">
          <Pagination
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={goToPage}
            onItemsPerPageChange={changeItemsPerPage}
            showItemsPerPageSelector={true}
            showPageNumbers={true}
            maxPageNumbers={5}
            itemsPerPageOptions={[10, 20, 50, 100]}
            className="justify-center"
          />
        </div>
      )}

      {/* Performance Note for Large Datasets */}
      {totalItems > 100 && (
        <div className="text-xs text-gray-500 text-center pt-2">
          💡 All {totalItems} placements are loaded for operations. Only {displayedItems.length} are displayed for performance.
        </div>
      )}
    </div>
  );
}
