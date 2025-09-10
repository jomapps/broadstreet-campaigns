'use client';

import { useState } from 'react';
import Link from 'next/link';
import FallbackAdWizard from '@/components/fallback-ad/FallbackAdWizard';

export default function QuickActions() {
  const [showFallbackAdWizard, setShowFallbackAdWizard] = useState(false);

  const handleSyncAll = async () => {
    try {
      const response = await fetch('/api/sync/all', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        alert('Sync completed successfully!');
        window.location.reload();
      } else {
        alert('Sync failed. Check console for details.');
      }
    } catch (error) {
      alert('Sync failed. Check console for details.');
      console.error('Sync error:', error);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowFallbackAdWizard(true)}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left"
          >
            <div>
              <h3 className="font-medium text-gray-900">Create Fallback Ad</h3>
              <p className="text-sm text-gray-600">Create fallback ad placements for campaigns</p>
            </div>
          </button>
          <button
            onClick={handleSyncAll}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left"
          >
            <div>
              <h3 className="font-medium text-gray-900">Sync Data</h3>
              <p className="text-sm text-gray-600">Sync all data from Broadstreet API</p>
            </div>
          </button>
        </div>
      </div>

      {showFallbackAdWizard && (
        <FallbackAdWizard onClose={() => setShowFallbackAdWizard(false)} />
      )}
    </>
  );
}
