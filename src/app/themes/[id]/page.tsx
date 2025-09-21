/**
 * THEME DETAIL PAGE - SERVER-SIDE PATTERN WITH ZUSTAND INTEGRATION
 *
 * Server page that fetches theme and zones data and passes to client component
 * for Zustand store initialization. Follows the server-client pattern
 * established in Phase 2 and Phase 3.
 * All variable names follow docs/variable-origins.md registry.
 */

import { Suspense } from 'react';
import { fetchThemeById, fetchZones } from '@/lib/server/data-fetchers';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ThemeDetailClient from './ThemeDetailClient';
import LoadingSkeleton from './LoadingSkeleton';

/**
 * Props interface for ThemeDetailPage
 * Variable names follow docs/variable-origins.md registry
 */
interface ThemeDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * ThemeDetailPage - Server component that fetches data and renders client
 * Variable names follow docs/variable-origins.md registry
 */
export default async function ThemeDetailPage({ params }: ThemeDetailPageProps) {
  // Await params for Next.js 15 compatibility
  const { id } = await params;

  // Fetch theme and zones data in parallel using existing data fetchers
  const [theme, zones] = await Promise.all([
    fetchThemeById(id),
    fetchZones(undefined) // Fetch all zones for zone management
  ]);

  if (!theme) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/themes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Themes
            </Button>
          </Link>
        </div>

        <div className="text-center py-12">
          <p className="text-red-600">Theme not found</p>
          <Link href="/themes" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Return to themes list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/themes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Themes
          </Button>
        </Link>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <ThemeDetailClient
          initialTheme={theme}
          initialZones={zones}
        />
      </Suspense>
    </div>
  );
}


