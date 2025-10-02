/**
 * Loading Skeleton for Request Detail View
 */
export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <div className="w-64 h-6 bg-gray-200 rounded"></div>
            <div className="w-48 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-20 h-6 bg-gray-200 rounded"></div>
            <div className="w-24 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
            <div className="w-28 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="w-18 h-4 bg-gray-200 rounded"></div>
            <div className="w-36 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-48 h-5 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="w-full h-4 bg-gray-200 rounded"></div>
            <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
            <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
