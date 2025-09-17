'use client';

import { useState, useEffect } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { useThemes } from '@/hooks/useThemes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { X, Palette } from 'lucide-react';

export default function ThemeSelector() {
  const { selectedTheme, selectThemeZones } = useFilters();
  const { themes, isLoading, error } = useThemes();

  const handleThemeSelection = (themeId: string) => {
    if (themeId === 'none') {
      selectThemeZones(null);
    } else {
      const theme = themes.find(t => t._id === themeId);
      if (theme) {
        selectThemeZones({
          _id: theme._id,
          name: theme.name,
          zone_ids: theme.zone_ids
        });
      }
    }
  };

  const clearThemeSelection = () => {
    selectThemeZones(null);
  };

  if (isLoading) {
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

  if (error || themes.length === 0) {
    return null; // Don't show if there are no themes or error
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
        <RadioGroup
          value={selectedTheme?._id || 'none'}
          onValueChange={handleThemeSelection}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="theme-none" />
            <Label 
              htmlFor="theme-none" 
              className="text-xs text-sidebar-foreground/70 cursor-pointer"
            >
              No theme filter
            </Label>
          </div>
          
          {themes.map((theme) => (
            <div key={theme._id} className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <RadioGroupItem value={theme._id} id={`theme-${theme._id}`} />
                <Label 
                  htmlFor={`theme-${theme._id}`} 
                  className="text-xs text-sidebar-foreground cursor-pointer truncate flex-1"
                  title={theme.name}
                >
                  {theme.name}
                </Label>
              </div>
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 ml-1 flex-shrink-0">
                {theme.zone_count || theme.zone_ids?.length || 0}
              </Badge>
            </div>
          ))}
        </RadioGroup>

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
