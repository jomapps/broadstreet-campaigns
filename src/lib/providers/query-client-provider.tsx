'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * React Query Provider Component
 * Provides React Query client to the application with optimized configuration
 * for the Broadstreet Campaigns application
 */
export default function QueryProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes by default
        staleTime: 5 * 60 * 1000,
        // Keep data in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 2 times
        retry: 2,
        // Don't refetch on window focus for better performance
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect for better performance
        refetchOnReconnect: false,
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
