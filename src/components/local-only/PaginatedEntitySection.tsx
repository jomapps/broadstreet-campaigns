/**
 * PAGINATED ENTITY SECTION COMPONENT
 * 
 * Enhanced EntitySection component with built-in pagination support.
 * Displays entities in paginated format while maintaining full dataset operations.
 * Variable names follow docs/variable-origins.md registry.
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';
import { usePaginatedEntities, PaginatedEntityConfig } from '@/lib/hooks/use-paginated-entities';
import { Trash2 } from 'lucide-react';

// Entity type for local entities with type discrimination
type LocalEntityWithType = {
  _id: string;
  name: string;
  type: string;
  created_at: string;
  broadstreet_id?: number;
  mongo_id?: string;
  [key: string]: any;
};

// Props interface for the paginated entity section
interface PaginatedEntitySectionProps {
  title: string;
  entities: LocalEntityWithType[];
  networkMap: Record<number, string>;
  advertiserMap: Record<number, string>;
  onDelete: (entityId: string, type: string) => void;
  selectedIds: Set<string>;
  onToggleSelection: (entityId: string) => void;
  onDeleteSection?: () => void;
  isDeletingSection?: boolean;
  paginationConfig?: PaginatedEntityConfig;
  mapEntityToCardProps: (
    entity: LocalEntityWithType,
    params: {
      networkName?: string;
      advertiserName?: string;
      onDelete: (entityId: string, type: string) => void;
      isSelected?: boolean;
      onToggleSelection?: (entityId: string) => void;
    }
  ) => any;
}

export default function PaginatedEntitySection({
  title,
  entities,
  networkMap,
  advertiserMap,
  onDelete,
  selectedIds,
  onToggleSelection,
  onDeleteSection,
  isDeletingSection,
  paginationConfig = { itemsPerPage: 20, enablePagination: true },
  mapEntityToCardProps,
}: PaginatedEntitySectionProps) {
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
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedEntities(entities, paginationConfig);

  // Don't render if no entities
  if (entities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
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
        </div>
        
        {onDeleteSection && (
          <Button
            onClick={onDeleteSection}
            disabled={isDeletingSection}
            variant="destructive"
            size="sm"
            className="h-6 px-2 text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            {isDeletingSection ? 'Deleting...' : `Delete All ${title}`}
          </Button>
        )}
      </div>

      {/* Pagination Info */}
      {paginationConfig.enablePagination && totalItems > paginationConfig.itemsPerPage! && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Showing {paginationInfo.showing}</span>
          <span className="text-xs">
            Operations (select, delete, sync) work on all {totalItems} items
          </span>
        </div>
      )}

      {/* Entity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedItems.map((entity) => (
          <UniversalEntityCard
            key={entity._id}
            {...mapEntityToCardProps(entity, {
              networkName: entity.type === 'network'
                ? entity.name // Networks don't have network_id, they ARE the network
                : networkMap[
                    typeof (entity as any).network_id === 'string'
                      ? Number((entity as any).network_id)
                      : (entity as any).network_id
                  ],
              advertiserName: entity.type === 'campaign'
                ? advertiserMap[
                    typeof (entity as any).advertiser_id === 'string'
                      ? Number((entity as any).advertiser_id)
                      : (entity as any).advertiser_id
                  ]
                : undefined,
              onDelete,
              isSelected: selectedIds.has(entity._id),
              onToggleSelection,
            })}
          />
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
          💡 All {totalItems} items are loaded for filtering and operations. Only {displayedItems.length} are displayed for performance.
        </div>
      )}
    </div>
  );
}
