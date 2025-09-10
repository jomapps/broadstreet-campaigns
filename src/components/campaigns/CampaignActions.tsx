'use client';

import { useState } from 'react';
import FallbackAdWizard from '@/components/fallback-ad/FallbackAdWizard';

export default function CampaignActions() {
  const [showFallbackAdWizard, setShowFallbackAdWizard] = useState(false);

  const handleSync = async () => {
    try {
      const response = await fetch('/api/sync/campaigns', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        alert(`Successfully synced ${result.count} campaigns!`);
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
      <div className="flex space-x-3">
        <button
          onClick={handleSync}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          Sync Campaigns
        </button>
        
        <button
          onClick={() => setShowFallbackAdWizard(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          Create Fallback Ad
        </button>
      </div>

      {showFallbackAdWizard && (
        <FallbackAdWizard onClose={() => setShowFallbackAdWizard(false)} />
      )}
    </>
  );
}
