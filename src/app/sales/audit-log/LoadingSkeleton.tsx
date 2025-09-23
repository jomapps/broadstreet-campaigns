'use client';

/**
 * Loading Skeleton for Audit Log Page
 * Shows loading state while audit data is being fetched
 */
export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Filters and Actions Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Search skeleton */}
          <div className="flex items-center space-x-2">
            <div className="w-64 h-10 bg-gray-200 rounded"></div>
            <div className="w-20 h-10 bg-gray-200 rounded"></div>
          </div>
          
          {/* Filter dropdowns skeleton */}
          <div className="w-32 h-10 bg-gray-200 rounded"></div>
          <div className="w-32 h-10 bg-gray-200 rounded"></div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Action buttons skeleton */}
          <div className="w-28 h-10 bg-gray-200 rounded"></div>
          <div className="w-24 h-10 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Results summary skeleton */}
      <div className="flex items-center justify-between">
        <div className="w-48 h-4 bg-gray-200 rounded"></div>
        <div className="w-32 h-4 bg-gray-200 rounded"></div>
      </div>

      {/* Audit request cards skeleton */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Card header */}
            <div className="p-6 pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div className="w-32 h-6 bg-gray-200 rounded"></div>
                    <div className="w-20 h-6 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-48 h-4 bg-gray-200 rounded"></div>
                </div>
                
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>

            {/* Card content */}
            <div className="px-6 pb-6">
              {/* Summary grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>

              {/* Advertisement summary */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-24 h-5 bg-gray-200 rounded"></div>
                  <div className="w-16 h-5 bg-gray-200 rounded"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="w-full h-4 bg-gray-200 rounded"></div>
                  <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                  <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>

              {/* Status summary */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="w-24 h-5 bg-gray-200 rounded mb-2"></div>
                <div className="flex items-center justify-between">
                  <div className="w-32 h-4 bg-gray-200 rounded"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded mt-2"></div>
              </div>

              {/* Expandable details button */}
              <div className="border-t pt-3">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-center space-x-2">
        <div className="w-20 h-10 bg-gray-200 rounded"></div>
        <div className="w-8 h-10 bg-gray-200 rounded"></div>
        <div className="w-8 h-10 bg-gray-200 rounded"></div>
        <div className="w-8 h-10 bg-gray-200 rounded"></div>
        <div className="w-20 h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
