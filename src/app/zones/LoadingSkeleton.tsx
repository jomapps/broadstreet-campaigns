/**
 * ZONES LOADING SKELETON - REUSABLE LOADING COMPONENT
 * 
 * Loading skeleton component for zones page that matches the expected
 * layout structure. Follows the loading skeleton pattern established
 * in Phase 2 (Dashboard, Networks, Advertisers).
 * All variable names follow docs/variable-origins.md registry.
 */

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Zone Count Display Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="text-right">
              <div className="h-8 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Size Filters Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Selection Controls Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="flex gap-3 mb-4">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      </div>

      {/* Search Input Skeleton */}
      <div className="max-w-md">
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Zones Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-12 h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="h-16 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
