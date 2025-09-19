/**
 * THEMES PAGE - SERVER-SIDE PATTERN WITH ZUSTAND INTEGRATION
 *
 * Server page that fetches themes data and passes to client component
 * for Zustand store initialization. Follows the server-client pattern
 * established in Phase 2 and Phase 3 (Dashboard, Networks, Advertisers, Zones, Campaigns, Advertisements, Placements).
 * All variable names follow docs/variable-origins.md registry.
 */

import { Suspense } from 'react';
import { fetchThemes } from '@/lib/server/data-fetchers';
import ThemesClient from './ThemesClient';
import LoadingSkeleton from './LoadingSkeleton';

/**
 * ThemesPage - Server component that fetches data and renders client
 * Variable names follow docs/variable-origins.md registry
 */
export default async function ThemesPage({ searchParams }) {
  // Await searchParams for Next.js 15 compatibility
  const params = await searchParams;

  // Fetch themes data using existing data fetcher
  const themes = await fetchThemes(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Themes</h1>
          <p className="text-gray-600 mt-1">
            Group zones together for easier campaign management
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <ThemesClient
          initialThemes={themes}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}


