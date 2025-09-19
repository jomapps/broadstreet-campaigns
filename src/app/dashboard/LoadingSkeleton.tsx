/**
 * DASHBOARD LOADING SKELETON - REUSABLE LOADING COMPONENT
 * 
 * Loading skeleton component for dashboard page while data is being fetched.
 * Follows the universal card design patterns and provides smooth loading experience.
 * All variable names follow docs/variable-origins.md registry.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * LoadingSkeleton - Dashboard loading skeleton component
 * Variable names follow docs/variable-origins.md registry
 */
export default function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats Grid Skeleton */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-full">
              <CardHeader className="pb-3">
                <div className="animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-muted rounded-lg"></div>
                      <div>
                        <div className="h-5 bg-muted rounded w-24 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-32"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-muted rounded w-12"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
