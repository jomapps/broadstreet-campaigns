import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Validation/Status Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
        </CardContent>
      </Card>

      {/* Placement Categories Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SQ Category Skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-blue-200 rounded animate-pulse w-16"></div>
              <div className="h-6 bg-blue-200 rounded-full animate-pulse w-8"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5"></div>
            </div>
          </CardContent>
        </Card>

        {/* LS Category Skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-purple-200 rounded animate-pulse w-16"></div>
              <div className="h-6 bg-purple-200 rounded-full animate-pulse w-8"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
            </div>
          </CardContent>
        </Card>

        {/* PT Category Skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-green-200 rounded animate-pulse w-16"></div>
              <div className="h-6 bg-green-200 rounded-full animate-pulse w-8"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5"></div>
            </div>
          </CardContent>
        </Card>

        {/* IGNORED Category Skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-red-200 rounded animate-pulse w-20"></div>
              <div className="h-6 bg-red-200 rounded-full animate-pulse w-8"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex justify-center space-x-4">
        <div className="h-10 bg-red-200 rounded animate-pulse w-48"></div>
        <div className="h-10 bg-green-200 rounded animate-pulse w-48"></div>
      </div>
    </div>
  );
}
