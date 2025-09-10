'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    <aside className={`bg-sidebar text-sidebar-foreground transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-72'} border-r border-sidebar-border`}>
      <div className="p-4 h-full flex flex-col space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {isCollapsed ? '→' : '← Collapse'}
        </Button>
        
        {!isCollapsed && (
          <>
            <Card className="bg-sidebar-accent/50 border-sidebar-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sidebar-foreground text-lg">Utilities</CardTitle>
                <CardDescription className="text-sidebar-foreground/70">Tools and actions for managing your campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {utilities.map((utility) => (
                  <div key={utility.name} className="bg-sidebar-accent/30 rounded-lg p-4 border border-sidebar-border/50">
                    <h3 className="font-medium text-sm text-sidebar-foreground mb-2">{utility.name}</h3>
                    <p className="text-xs text-sidebar-foreground/70 mb-4 leading-relaxed">{utility.description}</p>
                    <Button
                      onClick={() => handleUtilityAction(utility.action)}
                      size="sm"
                      className="w-full"
                    >
                      Execute
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card className="bg-sidebar-accent/50 border-sidebar-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sidebar-foreground text-lg">Quick Links</CardTitle>
                <CardDescription className="text-sidebar-foreground/70">Navigate to key sections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" size="sm" asChild className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <Link href="/dashboard" className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Dashboard</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <Link href="/campaigns" className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Campaigns</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <Link href="/zones" className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Zones</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <Link href="/advertisers" className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Advertisers</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </aside>
  );
}
