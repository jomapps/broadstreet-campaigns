'use client';

import React from 'react';
import { useAllFilters, useFilterActions } from '@/stores';
import { useEntityStore } from '@/stores';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Palette } from 'lucide-react';

export default function ThemeSelector() {
  const { selectedTheme } = useAllFilters();
  const { setSelectedTheme } = useFilterActions();
  const { themes, isLoading, errors } = useEntityStore();



  const handleThemeSelection = (themeId: string) => {
    if (themeId === 'none') {
      setSelectedTheme(null);
    } else {
      const theme = themes.find(t => t._id === themeId);
      if (theme) {
        setSelectedTheme({
          _id: theme._id,
          name: theme.name,
          zone_ids: theme.zone_ids
        } as any);
      }
    }
  };

  const clearThemeSelection = () => {
    setSelectedTheme(null);
  };

  if (isLoading.themes) {
    return (
      <Card className="bg-sidebar-accent/50 border-sidebar-border">
        <CardHeader className="pb-1">
          <CardTitle className="text-sidebar-foreground text-lg flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-20 bg-sidebar-accent/30 rounded-md animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (errors.themes) {
    return null; // Don't show if there's an error
  }

  // Show empty state if no themes, but still render the component
  if (themes.length === 0) {
    return (
      <Card className="bg-sidebar-accent/50 border-sidebar-border">
        <CardHeader className="pb-1">
          <CardTitle className="text-sidebar-foreground text-lg flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme Filter
          </CardTitle>
          <CardDescription className="text-sidebar-foreground/70 text-xs mt-1">
            No themes available
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-xs text-sidebar-foreground/70 text-center py-4">
            Create themes to enable filtering
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-sidebar-accent/50 border-sidebar-border">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sidebar-foreground text-lg flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Theme Filter
            </CardTitle>
            <CardDescription className="text-sidebar-foreground/70 text-xs mt-1">
              Select a theme to filter zones
            </CardDescription>
          </div>
          {selectedTheme && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearThemeSelection}
              className="h-6 w-6 p-0 text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        <div className="space-y-2">
          <div className="text-xs text-sidebar-foreground/70">Select Theme</div>
          <Select
            value={selectedTheme?._id || 'none'}
            onValueChange={handleThemeSelection}
          >
            <SelectTrigger className="h-8 text-xs bg-sidebar-accent/30 border-sidebar-border text-sidebar-foreground">
              <SelectValue placeholder="No theme filter">
                {selectedTheme ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate" title={selectedTheme.name}>
                      {selectedTheme.name}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-3 ml-2 flex-shrink-0">
                      {selectedTheme.zone_ids.length}
                    </Badge>
                  </div>
                ) : (
                  "No theme filter"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="none" className="text-xs">
                <div className="flex items-center justify-between w-full">
                  <span className="text-sidebar-foreground/70">No theme filter</span>
                </div>
              </SelectItem>

              {themes.map((theme) => (
                <SelectItem key={theme._id} value={theme._id} className="text-xs">
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate flex-1" title={theme.name}>
                      {theme.name}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-3 ml-2 flex-shrink-0">
                      {theme.zone_count || theme.zone_ids?.length || 0}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTheme && (
          <div className="pt-2 border-t border-sidebar-border">
            <div className="text-xs text-sidebar-foreground/70 mb-1">Selected Theme</div>
            <div className="h-8 bg-sidebar-accent/30 rounded-md flex items-center justify-between px-3">
              <span className="text-xs truncate max-w-[140px]" title={selectedTheme.name}>
                {selectedTheme.name}
              </span>
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                {selectedTheme.zone_ids.length} zones
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
