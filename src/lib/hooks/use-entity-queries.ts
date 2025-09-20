'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEntityStore, useFilterStore, EntityState } from '@/stores';

/**
 * Query keys for React Query caching
 * Organized by entity type for easy cache invalidation
 */
export const queryKeys = {
  networks: ['networks'] as const,
  advertisers: (networkId?: string) => ['advertisers', networkId] as const,
  zones: (networkId?: string) => ['zones', networkId] as const,
  campaigns: (advertiserId?: string, networkId?: string) => ['campaigns', advertiserId, networkId] as const,
  advertisements: (advertiserId?: string) => ['advertisements', advertiserId] as const,
  placements: (filters?: any) => ['placements', filters] as const,
  themes: ['themes'] as const,
  theme: (id: string) => ['theme', id] as const,
  audit: (filters?: any) => ['audit', filters] as const,
  localEntities: ['localEntities'] as const,
};

/**
 * Custom hook for fetching networks with React Query caching
 * Integrates with Zustand store for state management
 */
export function useNetworksQuery() {
  const { setNetworks, setLoading } = useEntityStore();
  
  return useQuery({
    queryKey: queryKeys.networks,
    queryFn: async () => {
      const response = await fetch('/api/networks');
      if (!response.ok) throw new Error('Failed to fetch networks');
      return response.json();
    },
  });
}

/**
 * Custom hook for fetching advertisers with React Query caching
 * Supports network filtering and integrates with Zustand store
 */
export function useAdvertisersQuery() {
  const { selectedNetwork } = useFilterStore();
  const { setAdvertisers, setLoading } = useEntityStore();
  
  const networkId = (selectedNetwork as any)?.broadstreet_id
    ? String((selectedNetwork as any).broadstreet_id)
    : undefined;

  return useQuery({
    queryKey: queryKeys.advertisers(networkId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (networkId) params.append('networkId', networkId);

      const response = await fetch(`/api/advertisers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch advertisers');
      return response.json();
    },
  });
}

/**
 * Custom hook for fetching zones with React Query caching
 * Supports network filtering and integrates with Zustand store
 */


/**
 * Custom hook for creating entities with optimistic updates
 * Provides immediate UI feedback while the request is processing
 */
export function useCreateEntityMutation(entityType: string) {
  const queryClient = useQueryClient();
  const { addEntity } = useEntityStore();
  
  return useMutation({
    mutationFn: async ({ data, endpoint }: { data: any; endpoint: string }) => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error(`Failed to create ${entityType}`);
      return response.json();
    },
    onMutate: async ({ data }) => {
      // Optimistic update: immediately add to UI
      const tempId = `temp-${Date.now()}`;
      const optimisticEntity = { ...data, _id: tempId, isOptimistic: true };
      addEntity(entityType as keyof EntityState, optimisticEntity);

      return { tempId };
    },
    onSuccess: (result, variables, context) => {
      // Replace optimistic entity with real data
      const { removeEntity, addEntity } = useEntityStore.getState();
      if (context?.tempId) {
        removeEntity(entityType as keyof EntityState, context.tempId);
      }
      addEntity(entityType as keyof EntityState, result);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [entityType] });
    },
    onError: (error, variables, context) => {
      // Remove optimistic entity on error
      const { removeEntity } = useEntityStore.getState();
      if (context?.tempId) {
        removeEntity(entityType as keyof EntityState, context.tempId);
      }
    },
  });
}

/**
 * Custom hook for updating entities with optimistic updates
 */
export function useUpdateEntityMutation(entityType: string) {
  const queryClient = useQueryClient();
  const { updateEntity } = useEntityStore();

  return useMutation({
    mutationFn: async ({ id, data, endpoint }: { id: string; data: any; endpoint: string }) => {
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(`Failed to update ${entityType}`);
      return response.json();
    },
    onMutate: async ({ id, data }) => {
      // Optimistic update
      const previousData = queryClient.getQueryData([entityType]);
      updateEntity(entityType as keyof EntityState, id, { ...data, isOptimistic: true });

      return { previousData };
    },
    onSuccess: (result) => {
      // Update with real data
      updateEntity(entityType as keyof EntityState, result._id, result);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [entityType] });
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousData) {
        queryClient.setQueryData([entityType], context.previousData);
      }
    },
  });
}

/**
 * Custom hook for deleting entities with optimistic updates
 */
export function useDeleteEntityMutation(entityType: string) {
  const queryClient = useQueryClient();
  const { removeEntity } = useEntityStore();

  return useMutation({
    mutationFn: async ({ id, endpoint }: { id: string; endpoint: string }) => {
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(`Failed to delete ${entityType}`);
      return { id };
    },
    onMutate: async ({ id }) => {
      // Optimistic update: immediately remove from UI
      const previousData = queryClient.getQueryData([entityType]);
      removeEntity(entityType as keyof EntityState, id);

      return { previousData };
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [entityType] });
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousData) {
        queryClient.setQueryData([entityType], context.previousData);
      }
    },
  });
}
