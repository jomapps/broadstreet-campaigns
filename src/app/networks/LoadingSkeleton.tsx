/**
 * NETWORKS LOADING SKELETON - REUSABLE LOADING COMPONENT
 * 
 * Loading skeleton component for networks page while data is being fetched.
 * Follows the universal card design patterns and provides smooth loading experience.
 * All variable names follow docs/variable-origins.md registry.
 */

/**
 * LoadingSkeleton - Networks loading skeleton component
 * Variable names follow docs/variable-origins.md registry
 */
export default function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Section Skeleton */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-muted rounded w-32 animate-pulse mb-2"></div>
            <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
      </div>

      {/* Networks Grid Section Skeleton */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-40 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-80 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Creation Button Skeleton */}
      <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
    </div>
  );
}
