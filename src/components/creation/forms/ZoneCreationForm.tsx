'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { getEntityId } from '@/lib/utils/entity-helpers';
import { EntityIdBadge } from '@/components/ui/entity-id-badge';

interface ZoneCreationFormProps {
  onClose: () => void;
  setIsLoading: (loading: boolean) => void;
}

export default function ZoneCreationForm({ onClose, setIsLoading }: ZoneCreationFormProps) {
  const entities = useSelectedEntities();
  const router = useRouter();
  const [formData, setFormData] = useState({
    // Required fields
    name: '',
    
    // Optional fields - empty by default
    advertisement_count: '',
    allow_duplicate_ads: false,
    concurrent_campaigns: '',
    advertisement_label: '',
    archived: false,
    display_type: 'standard' as 'standard' | 'rotation',
    rotation_interval: '',
    animation_type: 'none',
    width: '',
    height: '',
    alias: '',
    rss_shuffle: false,
    style: '',
    self_serve: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basicSettings: false,
    displayType: false,
    sizing: false,
    advanced: false,
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.display_type === 'rotation' && (!formData.rotation_interval || parseInt(formData.rotation_interval) < 1000)) {
      newErrors.rotation_interval = 'Rotation interval must be at least 1000ms (1 second)';
    }

    if (formData.width && (isNaN(parseInt(formData.width)) || parseInt(formData.width) < 1)) {
      newErrors.width = 'Width must be a positive number';
    }

    if (formData.height && (isNaN(parseInt(formData.height)) || parseInt(formData.height) < 1)) {
      newErrors.height = 'Height must be a positive number';
    }

    if (formData.advertisement_count && (isNaN(parseInt(formData.advertisement_count)) || parseInt(formData.advertisement_count) < 1)) {
      newErrors.advertisement_count = 'Advertisement count must be a positive number';
    }

    if (formData.concurrent_campaigns && (isNaN(parseInt(formData.concurrent_campaigns)) || parseInt(formData.concurrent_campaigns) < 0)) {
      newErrors.concurrent_campaigns = 'Concurrent campaigns must be a non-negative number';
    }

    // Network selection and ID availability validation
    if (!entities.network) {
      newErrors.network = 'Network selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const CollapsibleSection = ({ 
    title, 
    sectionKey, 
    children, 
    description 
  }: { 
    title: string; 
    sectionKey: keyof typeof expandedSections; 
    children: React.ReactNode;
    description?: string;
  }) => {
    const isExpanded = expandedSections[sectionKey];
    
    return (
      <div className="border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <div>
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="pt-4 space-y-4">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      // Build payload with only non-empty optional fields
      // For zone creation, we need the Broadstreet network ID specifically
      const networkBroadstreetId = entities.network?.ids.broadstreet_id;

      if (!networkBroadstreetId) {
        throw new Error('Network must be synced with Broadstreet to create zones');
      }

      const payload: any = {
        name: formData.name.trim(),
        network_id: networkBroadstreetId,
        network: {
          broadstreet_id: entities.network?.ids.broadstreet_id,
          mongo_id: entities.network?.ids.mongo_id,
        },
      };

      // Only add optional fields if they have values
      if (formData.advertisement_count && formData.advertisement_count.trim()) {
        payload.advertisement_count = parseInt(formData.advertisement_count);
      }
      
      if (formData.allow_duplicate_ads) {
        payload.allow_duplicate_ads = formData.allow_duplicate_ads;
      }
      
      if (formData.concurrent_campaigns && formData.concurrent_campaigns.trim()) {
        payload.concurrent_campaigns = parseInt(formData.concurrent_campaigns);
      }
      
      if (formData.advertisement_label && formData.advertisement_label.trim()) {
        payload.advertisement_label = formData.advertisement_label.trim();
      }
      
      if (formData.archived) {
        payload.archived = formData.archived;
      }
      
      if (formData.display_type && formData.display_type !== 'standard') {
        payload.display_type = formData.display_type;
      }
      
      if (formData.display_type === 'rotation' && formData.rotation_interval && formData.rotation_interval.trim()) {
        payload.rotation_interval = parseInt(formData.rotation_interval);
      }
      
      if (formData.animation_type && formData.animation_type !== 'none') {
        payload.animation_type = formData.animation_type;
      }
      
      if (formData.width && formData.width.trim()) {
        payload.width = parseInt(formData.width);
      }
      
      if (formData.height && formData.height.trim()) {
        payload.height = parseInt(formData.height);
      }
      
      if (formData.alias && formData.alias.trim()) {
        payload.alias = formData.alias.trim();
      }
      
      if (formData.rss_shuffle) {
        payload.rss_shuffle = formData.rss_shuffle;
      }
      
      if (formData.style && formData.style.trim()) {
        payload.style = formData.style.trim();
      }
      
      if (formData.self_serve) {
        payload.self_serve = formData.self_serve;
      }

      const response = await fetch('/api/create/zone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create zone');
      }

      const result = await response.json();
      
      // Show success message
      alert(`Zone "${result.zone.name}" created successfully!`);
      
      // Refresh the page to show the new zone
      router.refresh();
      
      onClose();
    } catch (error) {
      console.error('Error creating zone:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create zone' });
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full" data-testid="zone-creation-form">
      {/* Network Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800 flex items-center gap-2">
          <strong>Network:</strong> {entities.network?.name} <EntityIdBadge {...(entities.network?.ids || {})} />
        </p>
      </div>

      {errors.network && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-600">{errors.network}</p>
        </div>
      )}

      {/* Top Submit Button */}
      <div className="flex justify-end space-x-3 mb-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          data-testid="cancel-button"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !formData.name ||
            !entities.network ||
            !(entities.network?.ids && (entities.network.ids.broadstreet_id || entities.network.ids.mongo_id))
          }
          className="min-w-[120px]"
          data-testid="submit-button"
        >
          {isSubmitting ? 'Creating...' : 'Create Zone'}
        </Button>
      </div>

      {/* Required Field */}
      <div className="mb-6">
        <Label htmlFor="name">Zone Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="e.g., Top Banner 500x250"
          className={errors.name ? 'border-red-500' : ''}
          required
          data-testid="zone-name-input"
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* Collapsible Sections */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        <CollapsibleSection
          title="Basic Settings"
          sectionKey="basicSettings"
          description="Advertisement count, duplicates, and general settings"
        >
          <div>
            <Label htmlFor="advertisement_count">Advertisement Count</Label>
            <Input
              id="advertisement_count"
              type="number"
              min="1"
              value={formData.advertisement_count}
              onChange={(e) => handleInputChange('advertisement_count', e.target.value)}
              className={errors.advertisement_count ? 'border-red-500' : ''}
            />
            {errors.advertisement_count && <p className="text-sm text-red-500 mt-1">{errors.advertisement_count}</p>}
            <p className="text-sm text-gray-500 mt-1">
              Maximum number of ads to show in this zone
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allow_duplicate_ads"
              checked={formData.allow_duplicate_ads}
              onCheckedChange={(checked) => handleInputChange('allow_duplicate_ads', checked)}
            />
            <Label htmlFor="allow_duplicate_ads">Allow Duplicate Ads</Label>
          </div>

          <div>
            <Label htmlFor="concurrent_campaigns">Concurrent Campaigns</Label>
            <Input
              id="concurrent_campaigns"
              type="number"
              min="0"
              value={formData.concurrent_campaigns}
              onChange={(e) => handleInputChange('concurrent_campaigns', e.target.value)}
              className={errors.concurrent_campaigns ? 'border-red-500' : ''}
            />
            {errors.concurrent_campaigns && <p className="text-sm text-red-500 mt-1">{errors.concurrent_campaigns}</p>}
            <p className="text-sm text-gray-500 mt-1">
              Maximum number of concurrent campaigns (informational)
            </p>
          </div>

          <div>
            <Label htmlFor="advertisement_label">Advertisement Label</Label>
            <Input
              id="advertisement_label"
              value={formData.advertisement_label}
              onChange={(e) => handleInputChange('advertisement_label', e.target.value)}
              placeholder="e.g., Advertisement"
            />
            <p className="text-sm text-gray-500 mt-1">
              Text label that appears above the zone on your website
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="archived"
              checked={formData.archived}
              onCheckedChange={(checked) => handleInputChange('archived', checked)}
            />
            <Label htmlFor="archived">Archived</Label>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Display Type"
          sectionKey="displayType"
          description="How ads are displayed and rotated"
        >
          <div>
            <Label htmlFor="display_type">Display Type</Label>
            <Select value={formData.display_type} onValueChange={(value) => handleInputChange('display_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select display type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="rotation">Rotation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.display_type === 'rotation' && (
            <>
              <div>
                <Label htmlFor="rotation_interval">Rotation Interval (milliseconds)</Label>
                <Input
                  id="rotation_interval"
                  type="number"
                  min="1000"
                  value={formData.rotation_interval}
                  onChange={(e) => handleInputChange('rotation_interval', e.target.value)}
                  placeholder="5000"
                  className={errors.rotation_interval ? 'border-red-500' : ''}
                />
                {errors.rotation_interval && <p className="text-sm text-red-500 mt-1">{errors.rotation_interval}</p>}
                <p className="text-sm text-gray-500 mt-1">
                  Time interval between ad rotations (1000ms = 1 second)
                </p>
              </div>

              <div>
                <Label htmlFor="animation_type">Animation Type</Label>
                <Select value={formData.animation_type} onValueChange={(value) => handleInputChange('animation_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select animation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Sizing"
          sectionKey="sizing"
          description="Zone dimensions (optional, mainly for AMP)"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width">Width (pixels)</Label>
              <Input
                id="width"
                type="number"
                min="1"
                value={formData.width}
                onChange={(e) => handleInputChange('width', e.target.value)}
                placeholder="728"
                className={errors.width ? 'border-red-500' : ''}
              />
              {errors.width && <p className="text-sm text-red-500 mt-1">{errors.width}</p>}
            </div>
            <div>
              <Label htmlFor="height">Height (pixels)</Label>
              <Input
                id="height"
                type="number"
                min="1"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                placeholder="90"
                className={errors.height ? 'border-red-500' : ''}
              />
              {errors.height && <p className="text-sm text-red-500 mt-1">{errors.height}</p>}
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Only required for AMP customers. Helps avoid distorted images.
          </p>
        </CollapsibleSection>

        <CollapsibleSection
          title="Advanced Settings"
          sectionKey="advanced"
          description="Alias, CSS, and other advanced options"
        >
          <div>
            <Label htmlFor="alias">Alias</Label>
            <Input
              id="alias"
              value={formData.alias}
              onChange={(e) => handleInputChange('alias', e.target.value)}
              placeholder="zone-alias-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Shorthand name for ad tags
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="rss_shuffle"
              checked={formData.rss_shuffle}
              onCheckedChange={(checked) => handleInputChange('rss_shuffle', checked)}
            />
            <Label htmlFor="rss_shuffle">RSS Shuffle</Label>
          </div>

          <div>
            <Label htmlFor="style">Custom CSS Style</Label>
            <Textarea
              id="style"
              value={formData.style}
              onChange={(e) => handleInputChange('style', e.target.value)}
              placeholder="Additional CSS styles for this zone"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="self_serve"
              checked={formData.self_serve}
              onCheckedChange={(checked) => handleInputChange('self_serve', checked)}
            />
            <Label htmlFor="self_serve">Self Serve Zone</Label>
          </div>
        </CollapsibleSection>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Bottom Submit Button */}
      <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          data-testid="cancel-button"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !formData.name ||
            !entities.network ||
            !(entities.network?.ids && (entities.network.ids.broadstreet_id || entities.network.ids.mongo_id))
          }
          className="min-w-[120px]"
          data-testid="submit-button"
        >
          {isSubmitting ? 'Creating...' : 'Create Zone'}
        </Button>
      </div>
    </form>
  );
}