/**
 * LOCAL-ONLY PAGE - SERVER-SIDE PATTERN WITH ZUSTAND
 *
 * Refactored to use server-side data fetching with Zustand client state management.
 * Follows the PayloadCMS Local API pattern as outlined in zustand-implementation.md.
 * All variable names follow docs/variable-origins.md registry.
 */

import { Suspense } from 'react';
import { fetchLocalEntities, fetchNetworks } from '@/lib/server/data-fetchers';
import LocalOnlyClient from './LocalOnlyClient';
import LoadingSkeleton from './LoadingSkeleton';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Page props interface for Next.js 15 searchParams
 */
interface LocalOnlyPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Local-Only Page - Server-side data fetching with client-side Zustand state
 * Variable names follow docs/variable-origins.md registry
 */
export default async function LocalOnlyPage({ searchParams }: LocalOnlyPageProps) {
  // 1. Await searchParams (Next.js 15 requirement)
  const params = await searchParams;

  // 2. Fetch necessary data server-side using data fetchers
  // Variable names follow docs/variable-origins.md registry
  const [initialLocalEntities, initialNetworks] = await Promise.all([
    fetchLocalEntities(),
    fetchNetworks(),
  ]);

  // 3. Pass data to client component following the server-client pattern
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Local Only</h1>
          <p className="card-text text-gray-600 mt-1">
            Manage locally created entities before syncing to Broadstreet
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <LocalOnlyClient
          initialLocalEntities={initialLocalEntities}
          initialNetworks={initialNetworks}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}

