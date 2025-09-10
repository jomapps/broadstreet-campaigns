'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FiltersCard from './FiltersCard';

const utilities = [
  {
    name: 'Create Fallback Ad',
    description: 'Create fallback ad placements',
    action: 'fallback-ad',
  },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleUtilityAction = (action: string) => {
    switch (action) {
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
            {/* Filters Card */}
            <div className="mb-4">
              <FiltersCard />
            </div>
            
            <Card className="bg-sidebar-accent/50 border-sidebar-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sidebar-foreground text-lg">Utilities</CardTitle>
                <CardDescription className="text-sidebar-foreground/70">Tools and actions for managing your campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {utilities.map((utility) => (
                  <div key={utility.name} className="bg-sidebar-accent/30 rounded-lg p-3 border border-sidebar-border/50">
                    <p className="text-xs text-sidebar-foreground/70 mb-3 leading-relaxed">{utility.description}</p>
                    <Button
                      onClick={() => handleUtilityAction(utility.action)}
                      size="sm"
                      className="w-full"
                    >
                      {utility.name}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </aside>
  );
}
