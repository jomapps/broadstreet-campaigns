import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import AdvertisingRequest from '@/lib/models/advertising-request';
import RequestDetailClient from './RequestDetailClient';
import LoadingSkeleton from './LoadingSkeleton';

/**
 * Request Detail View Page - View individual advertising request
 * Follows the established server-client-content pattern
 */
export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 1. Await params and searchParams following Next.js 15 pattern
  const { id } = await params;
  const searchParamsData = await searchParams;

  // 2. Fetch the request data server-side
  let request = null;
  try {
    await connectDB();
    request = await AdvertisingRequest.findById(id)
      .lean({ virtuals: true }) as unknown as any;
    
    if (!request) {
      notFound();
    }
  } catch (error) {
    console.error('Error fetching request:', error);
    notFound();
  }

  // 3. Pass to client component following the server-client pattern
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Request Details</h1>
          <p className="card-text text-gray-600 mt-1">
            View advertising request information and manage status
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <RequestDetailClient 
          request={request}
          searchParams={searchParamsData} 
        />
      </Suspense>
    </div>
  );
}
