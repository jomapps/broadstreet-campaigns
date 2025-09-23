import { Suspense } from 'react';
import AuditLogClient from './AuditLogClient';
import LoadingSkeleton from './LoadingSkeleton';

/**
 * Sales Audit Log Page - View completed and cancelled advertising requests
 * Follows the established server-client-content pattern
 */
export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 1. Await searchParams following Next.js 15 pattern
  const params = await searchParams;

  // 2. For audit log, we'll fetch data client-side to allow filtering and pagination
  // This follows the pattern used in other list pages

  // 3. Pass to client component following the server-client pattern
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
          <p className="card-text text-gray-600 mt-1">
            View completed and cancelled advertising requests
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <AuditLogClient searchParams={params} />
      </Suspense>
    </div>
  );
}
