'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FiltersCard from './FiltersCard';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import CreatePlacementsModal from '@/components/placements/CreatePlacementsModal';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCreatePlacementsOpen, setIsCreatePlacementsOpen] = useState(false);
  const entities = useSelectedEntities();

  const canCreatePlacements = !!entities.campaign && entities.zones.length > 0 && entities.advertisements.length > 0;

  const utilities = useMemo(() => {
    return [
      {
        name: 'Create Placements',
        description: 'Requires: Campaign, Zones, Advertisement',
        action: 'create-placements',
        enabled: canCreatePlacements,
        disabledReason: !entities.campaign
          ? 'Select a campaign'
          : entities.zones.length === 0
          ? 'Select at least one zone'
          : entities.advertisements.length === 0
          ? 'Select at least one advertisement'
          : undefined,
      },
    ];
  }, [canCreatePlacements, entities.campaign, entities.zones.length, entities.advertisements.length]);

  const handleUtilityAction = (action: string) => {
    if (action === 'create-placements') {
      if (!canCreatePlacements) {
        const msg = utilities[0]?.disabledReason || 'Missing prerequisites';
        alert(`Cannot create placements: ${msg}`);
        return;
      }
      setIsCreatePlacementsOpen(true);
      return;
    }
    console.log('Utility action:', action);
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
                    {!utility.enabled && utility.disabledReason && (
                      <p className="text-xs text-red-400 mb-2">{utility.disabledReason}</p>
                    )}
                    <Button
                      onClick={() => handleUtilityAction(utility.action)}
                      size="sm"
                      className="w-full"
                      disabled={!utility.enabled}
                    >
                      {utility.name}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        <CreatePlacementsModal
          isOpen={isCreatePlacementsOpen}
          onClose={() => setIsCreatePlacementsOpen(false)}
        />
      </div>
    </aside>
  );
}
