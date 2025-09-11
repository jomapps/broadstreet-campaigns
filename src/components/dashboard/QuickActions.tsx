'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FallbackAdWizard from '@/components/fallback-ad/FallbackAdWizard';
import SyncProgress from '@/components/dashboard/SyncProgress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function QuickActions() {
  const [showFallbackAdWizard, setShowFallbackAdWizard] = useState(false);
  const [showSyncProgress, setShowSyncProgress] = useState(false);
  const router = useRouter();

  const handleSyncAll = () => {
    setShowSyncProgress(true);
  };

  const handleSyncComplete = (success: boolean) => {
    if (success) {
      // Reload the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  const handleCloseSyncProgress = () => {
    setShowSyncProgress(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 group-hover:scale-[1.02]" onClick={() => setShowFallbackAdWizard(true)}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold card-title group-hover:text-primary transition-colors">Create Fallback Ad</h3>
                <p className="card-text text-muted-foreground group-hover:text-primary/80 transition-colors">Create fallback ad placements for campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-green-500/5 hover:border-green-500/20 group-hover:scale-[1.02]" onClick={handleSyncAll}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold card-title group-hover:text-green-700 transition-colors">Sync Data</h3>
                <p className="card-text text-muted-foreground group-hover:text-green-600 transition-colors">Sync all data from Broadstreet API</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/5 hover:border-purple-500/20 group-hover:scale-[1.02]" onClick={() => router.push('/audit')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold card-title group-hover:text-purple-700 transition-colors">Audit Trail</h3>
                <p className="card-text text-muted-foreground group-hover:text-purple-600 transition-colors">View all successfully synced entities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showFallbackAdWizard && (
        <FallbackAdWizard onClose={() => setShowFallbackAdWizard(false)} />
      )}

      {showSyncProgress && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <SyncProgress 
            onComplete={handleSyncComplete}
            onClose={handleCloseSyncProgress}
          />
        </div>
      )}
    </>
  );
}
