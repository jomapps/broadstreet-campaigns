import { Suspense } from 'react';
import RequestClient from './RequestClient';
import LoadingSkeleton from './LoadingSkeleton';

/**
 * Sales Request Page - Create new advertising requests
 * Follows the established server-client-content pattern
 */
export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 1. Await searchParams following Next.js 15 pattern
  const params = await searchParams;

  // 2. For request creation, we don't need to fetch initial data
  // The form will be empty and ready for user input

  // 3. Pass to client component following the server-client pattern
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Advertising Request</h1>
          <p className="card-text text-gray-600 mt-1">
            Submit a new advertising request for the sales team to process
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <RequestClient searchParams={params} />
      </Suspense>
    </div>
  );
}
