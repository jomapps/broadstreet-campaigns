/**
 * ADVERTISERS LOADING SKELETON - REUSABLE LOADING COMPONENT
 * 
 * Loading skeleton component for advertisers page while data is being fetched.
 * Follows the universal card design patterns and provides smooth loading experience.
 * All variable names follow docs/variable-origins.md registry.
 */

/**
 * LoadingSkeleton - Advertisers loading skeleton component
 * Variable names follow docs/variable-origins.md registry
 */
export default function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search Input Skeleton */}
      <div className="max-w-md">
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Advertisers Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-16 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
