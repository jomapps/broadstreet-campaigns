'use client';

/**
 * Loading Skeleton for Request Creation Page
 * Shows loading state while the form is being prepared
 */
export default function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      {/* Progress indicator skeleton */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="ml-2 w-24 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="ml-2 w-24 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="ml-2 w-24 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Form skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="w-48 h-6 bg-gray-200 rounded mb-2"></div>
          <div className="w-96 h-4 bg-gray-200 rounded"></div>
        </div>

        {/* Form fields */}
        <div className="space-y-6">
          {/* Two column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
              <div className="w-full h-10 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
              <div className="w-full h-10 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="w-28 h-4 bg-gray-200 rounded mb-2"></div>
              <div className="w-full h-10 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="w-20 h-4 bg-gray-200 rounded mb-2"></div>
              <div className="w-full h-10 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="w-16 h-4 bg-gray-200 rounded mb-2"></div>
              <div className="w-full h-10 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Textarea fields */}
          <div>
            <div className="w-36 h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-full h-24 bg-gray-200 rounded"></div>
          </div>

          <div>
            <div className="w-28 h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-full h-20 bg-gray-200 rounded"></div>
          </div>

          {/* File upload area */}
          <div>
            <div className="w-24 h-4 bg-gray-200 rounded mb-3"></div>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
              <div className="w-12 h-12 bg-gray-200 rounded mx-auto mb-4"></div>
              <div className="w-48 h-4 bg-gray-200 rounded mx-auto mb-2"></div>
              <div className="w-32 h-3 bg-gray-200 rounded mx-auto mb-4"></div>
              <div className="w-24 h-8 bg-gray-200 rounded mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="border-t border-gray-200 pt-6 mt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-20 h-9 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-16 h-9 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="w-48 h-3 bg-gray-200 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
