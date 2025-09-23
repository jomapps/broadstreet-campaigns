import { Suspense } from 'react';
import OpenListClient from './OpenListClient';
import LoadingSkeleton from './LoadingSkeleton';

/**
 * Sales Open List Page - View and manage pending advertising requests
 * Follows the established server-client-content pattern
 */
export default async function OpenListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 1. Await searchParams following Next.js 15 pattern
  const params = await searchParams;

  // 2. For open list, we'll fetch data client-side to allow real-time updates
  // This follows the pattern used in other list pages where data changes frequently

  // 3. Pass to client component following the server-client pattern
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Open Requests</h1>
          <p className="card-text text-gray-600 mt-1">
            View and manage pending advertising requests
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <OpenListClient searchParams={params} />
      </Suspense>
    </div>
  );
}
