'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Copy, Loader2 } from 'lucide-react';

interface Campaign {
  broadstreet_id?: number;
  mongo_id?: string;
  name: string;
  placements?: Array<{
    zone_id: number;
    advertisement_id: number;
  }>;
}

interface CopyZonesToThemeModalProps {
  campaign: Campaign;
  onCopyZonesToTheme: (campaignName: string, themeName: string, description?: string) => Promise<void>;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export default function CopyZonesToThemeModal({ 
  campaign, 
  onCopyZonesToTheme, 
  trigger,
  disabled = false 
}: CopyZonesToThemeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [themeName, setThemeName] = useState(`${campaign.name} Zones`);
  const [description, setDescription] = useState(`Zones from campaign: ${campaign.name}`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get unique zone IDs from campaign placements
  const uniqueZoneIds = campaign.placements 
    ? [...new Set(campaign.placements.map(p => p.zone_id))]
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!themeName.trim()) return;
    
    try {
      setIsSubmitting(true);
      await onCopyZonesToTheme(campaign.name, themeName.trim(), description.trim() || undefined);
      
      // Reset and close modal
      setIsOpen(false);
    } catch (error) {
      console.error('Error copying zones to theme:', error);
      // Keep modal open on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setThemeName(`${campaign.name} Zones`);
    setDescription(`Zones from campaign: ${campaign.name}`);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            size="sm"
            disabled={disabled || uniqueZoneIds.length === 0}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Zones to Theme
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Copy Campaign Zones to Theme</DialogTitle>
            <DialogDescription>
              Create a new theme with all zones from the campaign &quot;{campaign.name}&quot;.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Campaign Info */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{campaign.name}</p>
                  <p className="text-sm text-gray-600">
                    Campaign ID: {campaign.broadstreet_id || campaign.mongo_id}
                  </p>
                </div>
                <Badge variant="secondary">
                  {uniqueZoneIds.length} zone{uniqueZoneIds.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              {uniqueZoneIds.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Zone IDs:</p>
                  <div className="flex flex-wrap gap-1">
                    {uniqueZoneIds.slice(0, 10).map(zoneId => (
                      <Badge key={zoneId} variant="outline" className="text-xs">
                        {zoneId}
                      </Badge>
                    ))}
                    {uniqueZoneIds.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{uniqueZoneIds.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {uniqueZoneIds.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">This campaign has no zones to copy.</p>
              </div>
            ) : (
              <>
                {/* Theme Name */}
                <div className="grid gap-2">
                  <Label htmlFor="theme-name">
                    Theme Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="theme-name"
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                    placeholder="Enter theme name..."
                    disabled={isSubmitting}
                    maxLength={100}
                    required
                  />
                </div>
                
                {/* Theme Description */}
                <div className="grid gap-2">
                  <Label htmlFor="theme-description">
                    Description <span className="text-gray-500">(optional)</span>
                  </Label>
                  <Textarea
                    id="theme-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this theme..."
                    disabled={isSubmitting}
                    maxLength={500}
                    rows={3}
                  />
                </div>
              </>
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
              type="submit"
              disabled={isSubmitting || !themeName.trim() || uniqueZoneIds.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Theme...
                </>
              ) : (
                `Create Theme with ${uniqueZoneIds.length} Zone${uniqueZoneIds.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
