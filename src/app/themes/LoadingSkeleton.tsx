/**
 * THEMES LOADING SKELETON - REUSABLE LOADING COMPONENT
 * 
 * Loading skeleton component for themes page that matches the expected
 * layout structure. Follows the loading skeleton pattern established
 * in Phase 2 and Phase 3 (Dashboard, Networks, Advertisers, Zones, Campaigns, Advertisements, Placements).
 * All variable names follow docs/variable-origins.md registry.
 */

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search Input Skeleton */}
      <div className="flex items-center justify-between">
        <div className="max-w-md flex-1">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>

      {/* Themes Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
