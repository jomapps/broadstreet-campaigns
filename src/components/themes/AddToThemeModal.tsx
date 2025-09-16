'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';

interface Theme {
  _id: string;
  name: string;
  description?: string;
  zone_count: number;
  zone_ids: number[];
}

interface AddToThemeModalProps {
  selectedZoneIds: number[];
  onAddToThemes: (themeIds: string[], zoneIds: number[]) => Promise<void>;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export default function AddToThemeModal({ 
  selectedZoneIds, 
  onAddToThemes, 
  trigger,
  disabled = false 
}: AddToThemeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch themes when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchThemes();
    }
  }, [isOpen]);

  const fetchThemes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/themes');
      
      if (!response.ok) {
        throw new Error('Failed to fetch themes');
      }
      
      const data = await response.json();
      setThemes(data.themes || []);
    } catch (error) {
      console.error('Error fetching themes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeToggle = (themeId: string, checked: boolean) => {
    if (checked) {
      setSelectedThemeIds(prev => [...prev, themeId]);
    } else {
      setSelectedThemeIds(prev => prev.filter(id => id !== themeId));
    }
  };

  const handleSubmit = async () => {
    if (selectedThemeIds.length === 0) return;
    
    try {
      setIsSubmitting(true);
      await onAddToThemes(selectedThemeIds, selectedZoneIds);
      
      // Reset and close modal
      setSelectedThemeIds([]);
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding zones to themes:', error);
      // Keep modal open on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedThemeIds([]);
    setIsOpen(false);
  };

  // Check if zone is already in theme
  const isZoneInTheme = (theme: Theme, zoneId: number) => {
    return theme.zone_ids.includes(zoneId);
  };

  // Get zones that would be added to each theme
  const getNewZonesForTheme = (theme: Theme) => {
    return selectedZoneIds.filter(zoneId => !isZoneInTheme(theme, zoneId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button disabled={disabled || selectedZoneIds.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Add to Theme
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Zones to Themes</DialogTitle>
          <DialogDescription>
            Select themes to add {selectedZoneIds.length} selected zone{selectedZoneIds.length !== 1 ? 's' : ''} to.
            Zones already in a theme will be skipped.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading themes...</span>
            </div>
          ) : themes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No themes available.</p>
              <p className="text-sm text-gray-400">Create a theme first to add zones to it.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {themes.map((theme) => {
                const newZones = getNewZonesForTheme(theme);
                const hasNewZones = newZones.length > 0;
                
                return (
                  <div 
                    key={theme._id} 
                    className={`flex items-start space-x-3 p-3 rounded-lg border ${
                      hasNewZones ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <Checkbox
                      id={theme._id}
                      checked={selectedThemeIds.includes(theme._id)}
                      onCheckedChange={(checked) => handleThemeToggle(theme._id, !!checked)}
                      disabled={!hasNewZones}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <label 
                        htmlFor={theme._id} 
                        className={`block font-medium cursor-pointer ${
                          hasNewZones ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {theme.name}
                      </label>
                      
                      {theme.description && (
                        <p className={`text-sm mt-1 ${
                          hasNewZones ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {theme.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {theme.zone_count} zones
                        </Badge>
                        
                        {hasNewZones ? (
                          <Badge variant="outline" className="text-xs text-green-700 border-green-200">
                            +{newZones.length} new
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            All zones already added
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedThemeIds.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              `Add to ${selectedThemeIds.length} Theme${selectedThemeIds.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
