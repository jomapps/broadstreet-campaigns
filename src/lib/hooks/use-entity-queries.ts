'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEntityStore, useFilterStore } from '@/stores';

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
    onSuccess: (data) => {
      setNetworks(data);
      setLoading('networks', false);
    },
    onError: () => {
      setLoading('networks', false);
    },
  });
}

/**
 * Custom hook for fetching advertisers with React Query caching
 * Supports network filtering and integrates with Zustand store
 */
export function useAdvertisersQuery() {
  const { selectedNetworkId } = useFilterStore();
  const { setAdvertisers, setLoading } = useEntityStore();
  
  return useQuery({
    queryKey: queryKeys.advertisers(selectedNetworkId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedNetworkId) params.append('networkId', selectedNetworkId);
      
      const response = await fetch(`/api/advertisers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch advertisers');
      return response.json();
    },
    onSuccess: (data) => {
      setAdvertisers(data);
      setLoading('advertisers', false);
    },
    onError: () => {
      setLoading('advertisers', false);
    },
  });
}

/**
 * Custom hook for fetching zones with React Query caching
 * Supports network filtering and integrates with Zustand store
 */
export function useZonesQuery() {
  const { selectedNetworkId } = useFilterStore();
  const { setZones, setLoading } = useEntityStore();
  
  return useQuery({
    queryKey: queryKeys.zones(selectedNetworkId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedNetworkId) params.append('networkId', selectedNetworkId);
      
      const response = await fetch(`/api/zones?${params}`);
      if (!response.ok) throw new Error('Failed to fetch zones');
      return response.json();
    },
    onSuccess: (data) => {
      setZones(data);
      setLoading('zones', false);
    },
    onError: () => {
      setLoading('zones', false);
    },
  });
}

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
      addEntity(entityType, optimisticEntity);
      
      return { tempId };
    },
    onSuccess: (result, variables, context) => {
      // Replace optimistic entity with real data
      const { removeEntity, addEntity } = useEntityStore.getState();
      removeEntity(entityType, context.tempId);
      addEntity(entityType, result);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [entityType] });
    },
    onError: (error, variables, context) => {
      // Remove optimistic entity on error
      const { removeEntity } = useEntityStore.getState();
      removeEntity(entityType, context.tempId);
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
      updateEntity(entityType, id, { ...data, isOptimistic: true });
      
      return { previousData };
    },
    onSuccess: (result) => {
      // Update with real data
      updateEntity(entityType, result._id, result);
      
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
      removeEntity(entityType, id);
      
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
