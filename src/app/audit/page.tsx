/**
 * AUDIT PAGE - SERVER-SIDE PATTERN WITH ZUSTAND INTEGRATION
 *
 * Server page that fetches audit data and passes to client component
 * for Zustand store initialization. Follows the server-client pattern
 * established in Phase 2 and Phase 3.
 * All variable names follow docs/variable-origins.md registry.
 */

import { Suspense } from 'react';
import { fetchAuditData } from '@/lib/server/data-fetchers';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AuditClient from './AuditClient';
import LoadingSkeleton from './LoadingSkeleton';

/**
 * Props interface for AuditPage
 * Variable names follow docs/variable-origins.md registry
 */
interface AuditPageProps {
  searchParams: Promise<{
    search?: string;
    type?: string;
    offset?: string;
    limit?: string;
  }>;
}

/**
 * AuditPage - Server component that fetches data and renders client
 * Variable names follow docs/variable-origins.md registry
 */
export default async function AuditPage({ searchParams }: AuditPageProps) {
  // Await searchParams for Next.js 15 compatibility
  const params = await searchParams;

  // Fetch audit data using existing data fetcher
  const auditData = await fetchAuditData(params);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/local-only">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Local Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
            <p className="text-gray-600">View all successfully synced entities</p>
          </div>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <AuditClient
          initialAuditData={auditData}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}




