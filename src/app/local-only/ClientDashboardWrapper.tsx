'use client';

import { useEffect, useState } from 'react';
import LocalOnlyDashboard from './LocalOnlyDashboard';

// Type definitions
type LocalOnlyData = {
  zones: any[];
  advertisers: any[];
  campaigns: any[];
  networks: any[];
  advertisements: any[];
  placements: any[];
};

interface ClientDashboardWrapperProps {
  data: LocalOnlyData;
  networkMap: Record<number, string>;
  advertiserMap: Record<number, string>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
      ))}
    </div>
  );
}

export default function ClientDashboardWrapper({ data, networkMap, advertiserMap }: ClientDashboardWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <LoadingSkeleton />;
  }

  return (
    <LocalOnlyDashboard 
      data={data}
      networkMap={networkMap}
      advertiserMap={advertiserMap}
    />
  );
}
