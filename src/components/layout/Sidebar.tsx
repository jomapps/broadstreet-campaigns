'use client';

import { useState } from 'react';
import Link from 'next/link';

const utilities = [
  {
    name: 'Sync Data',
    description: 'Sync all data from Broadstreet API',
    action: 'sync',
  },
  {
    name: 'Create Fallback Ad',
    description: 'Create fallback ad placements',
    action: 'fallback-ad',
  },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSync = async () => {
    try {
      const response = await fetch('/api/sync/all', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        alert('Sync completed successfully!');
        window.location.reload();
      } else {
        alert('Sync failed. Check console for details.');
        console.error('Sync error:', result);
      }
    } catch (error) {
      alert('Sync failed. Check console for details.');
      console.error('Sync error:', error);
    }
  };

  const handleUtilityAction = (action: string) => {
    switch (action) {
      case 'sync':
        handleSync();
        break;
      case 'fallback-ad':
        // Navigate to fallback ad creation
        window.location.href = '/campaigns?utility=fallback-ad';
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <aside className={`bg-gray-800 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full text-left text-sm font-medium text-gray-300 hover:text-white mb-6"
        >
          {isCollapsed ? '→' : '← Collapse'}
        </button>
        
        {!isCollapsed && (
          <>
            <h2 className="text-lg font-semibold mb-4">Utilities</h2>
            
            <div className="space-y-3">
              {utilities.map((utility) => (
                <div key={utility.name} className="bg-gray-700 rounded-lg p-3">
                  <h3 className="font-medium text-sm mb-1">{utility.name}</h3>
                  <p className="text-xs text-gray-300 mb-3">{utility.description}</p>
                  <button
                    onClick={() => handleUtilityAction(utility.action)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors duration-200"
                  >
                    Execute
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/dashboard"
                  className="block text-sm text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Dashboard
                </Link>
                <Link
                  href="/campaigns"
                  className="block text-sm text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Campaigns
                </Link>
                <Link
                  href="/zones"
                  className="block text-sm text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Zones
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
