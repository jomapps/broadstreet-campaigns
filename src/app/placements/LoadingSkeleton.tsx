/**
 * PLACEMENTS LOADING SKELETON - REUSABLE LOADING COMPONENT
 * 
 * Loading skeleton component for placements page that matches the expected
 * layout structure. Follows the loading skeleton pattern established
 * in Phase 2 (Dashboard, Networks, Advertisers, Zones, Campaigns, Advertisements).
 * All variable names follow docs/variable-origins.md registry.
 */

export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-2.5 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-12 h-5 bg-gray-200 rounded ml-2"></div>
            </div>
            <div className="space-y-2 mb-3">
              <div className="flex justify-between">
                <div className="h-2.5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-2.5 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-2.5 bg-gray-200 rounded w-1/3"></div>
                <div className="h-2.5 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-2.5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-2.5 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-between">
              <div className="h-2.5 bg-gray-200 rounded w-1/3"></div>
              <div className="h-2.5 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
