'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAllFilters, useEntityStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { getEntityId } from '@/lib/utils/entity-helpers';
import { EntityIdBadge } from '@/components/ui/entity-id-badge';

interface CampaignCreationFormProps {
  onClose: () => void;
  setIsLoading: (loading: boolean) => void;
}

export default function CampaignCreationForm({ onClose, setIsLoading }: CampaignCreationFormProps) {
  const { selectedNetwork, selectedAdvertiser } = useAllFilters();
  const { setCampaigns } = useEntityStore();

  // Create entities object for compatibility with existing code
  const entities = {
    network: selectedNetwork,
    advertiser: selectedAdvertiser
  };
  const router = useRouter();
  
  // Get today's date in datetime-local format
  const getTodayDateTime = () => {
    const now = new Date();
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Format date with smart default times
  const formatDateTimeWithDefaults = (dateString: string, isEndDate: boolean = false) => {
    if (!dateString) return '';
    
    // If it already has time, return as is
    if (dateString.includes('T')) return dateString;
    
    // If it's just a date, add smart default time
    const defaultTime = isEndDate ? '23:59' : '00:00';
    return `${dateString}T${defaultTime}`;
  };

  const [formData, setFormData] = useState({
    // Required fields
    name: '',
    start_date: getTodayDateTime(),
    weight: 1, // Default weight (default = 1)
    
    // Optional fields - empty by default
    end_date: '',
    max_impression_count: '',
    display_type: 'no_repeat' as 'no_repeat' | 'allow_repeat_campaign' | 'allow_repeat_advertisement' | 'force_repeat_campaign',
    pacing_type: 'asap' as 'asap' | 'even',
    impression_max_type: 'cap' as 'cap' | 'goal',
    path: '',
    notes: '',
    active: true,
    archived: false,
    paused: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basicSettings: false,
    displaySettings: false,
    advancedSettings: false,
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required field validations
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!entities.network) {
      newErrors.network = 'Network selection is required';
    } else if (!(entities.network as any).broadstreet_id) {
      // Campaign creation requires a Broadstreet network ID
      newErrors.network = 'Network must be synced with Broadstreet to create campaigns';
    }

    if (!entities.advertiser) {
      newErrors.advertiser = 'Advertiser selection is required';
    } else if (!(entities.advertiser as any).broadstreet_id && !(entities.advertiser as any).mongo_id) {
      // Ensure at least one ID type is available
      newErrors.advertiser = 'Advertiser must have at least one ID (broadstreet_id or mongo_id)';
    }

    // Date validation
    if (formData.end_date && formData.start_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    // Weight validation (should be one of the predefined values)
    const validWeights = [0, 0.5, 1, 1.5, 127];
    if (!validWeights.includes(formData.weight)) {
      newErrors.weight = 'Weight must be one of the predefined values';
    }

    // Optional field validations
    if (formData.max_impression_count && (isNaN(parseInt(formData.max_impression_count)) || parseInt(formData.max_impression_count) < 1)) {
      newErrors.max_impression_count = 'Max impression count must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    let processedValue = value;
    
    // Apply smart default times for date fields
    if (field === 'start_date') {
      processedValue = formatDateTimeWithDefaults(value, false);
    } else if (field === 'end_date') {
      processedValue = formatDateTimeWithDefaults(value, true);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
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
      // Build payload with required fields
      // For campaign creation, Broadstreet network ID is required
      const networkBroadstreetId = (entities.network as any)?.broadstreet_id;
      const advertiserIdValue = (entities.advertiser as any)?.broadstreet_id || (entities.advertiser as any)?.mongo_id;
      // Validate that we have the required Broadstreet network ID
      if (!networkBroadstreetId) {
        throw new Error('Network must be synced with Broadstreet to create campaigns');
      }
      if (!advertiserIdValue) {
        throw new Error('Advertiser ID is required but not available');
      }

      const payload: any = {
        name: formData.name.trim(),
        // Campaign API requires numeric Broadstreet network_id
        network_id: networkBroadstreetId,
        // Include numeric advertiser_id when present; otherwise include explicit advertiser object with mongo_id
        ...(typeof advertiserIdValue === 'number' ? { advertiser_id: advertiserIdValue } : {}),
        // Also include explicit ID objects to avoid ambiguity downstream
        network: {
          broadstreet_id: (entities.network as any)?.broadstreet_id,
          mongo_id: (entities.network as any)?.mongo_id,
        },
        advertiser: {
          broadstreet_id: (entities.advertiser as any)?.broadstreet_id,
          mongo_id: (entities.advertiser as any)?.mongo_id,
        },
        start_date: formData.start_date,
        weight: parseFloat(formData.weight.toString()), // Ensure weight is a number
      };

      // Only add optional fields if they have values
      
      if (formData.end_date && formData.end_date.trim()) {
        payload.end_date = formData.end_date.trim();
      }
      
      
      if (formData.max_impression_count && formData.max_impression_count.trim()) {
        payload.max_impression_count = parseInt(formData.max_impression_count);
      }
      
      if (formData.display_type && formData.display_type !== 'no_repeat') {
        payload.display_type = formData.display_type;
      }
      
      if (formData.pacing_type && formData.pacing_type !== 'asap') {
        payload.pacing_type = formData.pacing_type;
      }
      
      if (formData.impression_max_type && formData.impression_max_type !== 'cap') {
        payload.impression_max_type = formData.impression_max_type;
      }
      
      if (formData.path && formData.path.trim()) {
        payload.path = formData.path.trim();
      }
      
      if (formData.notes && formData.notes.trim()) {
        payload.notes = formData.notes.trim();
      }
      
      if (!formData.active) {
        payload.active = formData.active;
      }
      
      if (formData.archived) {
        payload.archived = formData.archived;
      }
      
      if (formData.paused) {
        payload.paused = formData.paused;
      }

      const response = await fetch('/api/create/campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create campaign');
      }

      const result = await response.json();

      // Show success message
      alert(`Campaign "${result.campaign.name}" created successfully!`);

      // Immediately reload campaigns for the current advertiser so the list updates without a full reload
      try {
        if (entities.advertiser) {
          const advId = (entities.advertiser as any).broadstreet_id || (entities.advertiser as any).mongo_id;
          const listRes = await fetch(`/api/campaigns?advertiser_id=${encodeURIComponent(String(advId ?? ''))}` , { cache: 'no-store' });
          if (listRes.ok) {
            const listData = await listRes.json();
            setCampaigns(listData.campaigns || []);
          }
        }
      } catch (e) {
        console.info('Post-create campaigns reload failed; falling back to refresh');
      }
      
      // Soft refresh for any server components
      router.refresh();
      
      onClose();
    } catch (error) {
      console.error('Error creating campaign:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create campaign' });
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full" data-testid="campaign-creation-form">
      {/* Network Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="text-sm text-blue-800 flex items-center gap-2">
          <strong>Network:</strong> {(entities.network as any)?.name}
          <EntityIdBadge broadstreet_id={(entities.network as any)?.broadstreet_id} mongo_id={(entities.network as any)?.mongo_id} />
        </div>
        {entities.advertiser && (
          <div className="text-sm text-blue-800 flex items-center gap-2">
            <strong>Advertiser:</strong> {(entities.advertiser as any).name} <EntityIdBadge broadstreet_id={(entities.advertiser as any)?.broadstreet_id} mongo_id={(entities.advertiser as any)?.mongo_id} />
          </div>
        )}
      </div>

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
          disabled={isSubmitting || !formData.name || !formData.start_date || !(entities.network as any)?.broadstreet_id || !entities.advertiser}
          className="min-w-[120px]"
          data-testid="submit-button"
        >
          {isSubmitting ? 'Creating...' : 'Create Campaign'}
        </Button>
      </div>

      {/* Required Fields */}
      <div className="mb-6 space-y-4">
        <div>
          <Label htmlFor="name">Campaign Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Summer Sale Campaign"
            className={errors.name ? 'border-red-500' : ''}
            required
            data-testid="campaign-name-input"
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date ? formData.start_date.split('T')[0] : ''}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className={errors.start_date ? 'border-red-500' : ''}
                required
              />
              {errors.start_date && <p className="text-sm text-red-500 mt-1">{errors.start_date}</p>}
              <p className="text-sm text-gray-500 mt-1">
                When the campaign will go live (defaults to 12:00 AM)
              </p>
            </div>

            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date ? formData.end_date.split('T')[0] : ''}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                className={errors.end_date ? 'border-red-500' : ''}
              />
              {errors.end_date && <p className="text-sm text-red-500 mt-1">{errors.end_date}</p>}
              <p className="text-sm text-gray-500 mt-1">
                When the campaign will end (defaults to 11:59 PM)
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="weight">Weight *</Label>
            <Select value={formData.weight.toString()} onValueChange={(value) => handleInputChange('weight', parseFloat(value))}>
              <SelectTrigger className={errors.weight ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select campaign weight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Remnant (0)</SelectItem>
                <SelectItem value="0.5">Low (0.5)</SelectItem>
                <SelectItem value="1">Default (1)</SelectItem>
                <SelectItem value="1.5">High (1.5)</SelectItem>
                <SelectItem value="127">Sponsorship (127)</SelectItem>
              </SelectContent>
            </Select>
            {errors.weight && <p className="text-sm text-red-500 mt-1">{errors.weight}</p>}
            <p className="text-sm text-gray-500 mt-1">
              Campaign priority for rotation
            </p>
          </div>
        </div>

        {/* Network and Advertiser Validation */}
        {errors.network && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{errors.network}</p>
          </div>
        )}
        {errors.advertiser && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{errors.advertiser}</p>
          </div>
        )}
      </div>

      {/* Collapsible Sections */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        <CollapsibleSection
          title="Basic Settings"
          sectionKey="basicSettings"
          description="Impression limits and campaign settings"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_impression_count">Max Impressions</Label>
              <Input
                id="max_impression_count"
                type="number"
                min="1"
                value={formData.max_impression_count}
                onChange={(e) => handleInputChange('max_impression_count', e.target.value)}
                placeholder="Leave empty for unlimited"
                className={errors.max_impression_count ? 'border-red-500' : ''}
              />
              {errors.max_impression_count && <p className="text-sm text-red-500 mt-1">{errors.max_impression_count}</p>}
              <p className="text-sm text-gray-500 mt-1">
                Maximum number of impressions (optional)
              </p>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Display Settings"
          sectionKey="displaySettings"
          description="Display type, pacing type, and impression limits"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="display_type">Display Type</Label>
              <Select value={formData.display_type} onValueChange={(value) => handleInputChange('display_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select display type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_repeat">No Repeat</SelectItem>
                  <SelectItem value="allow_repeat_campaign">Allow Repeat Campaign</SelectItem>
                  <SelectItem value="allow_repeat_advertisement">Allow Repeat Advertisement</SelectItem>
                  <SelectItem value="force_repeat_campaign">Force Repeat Campaign</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                How the campaign displays
              </p>
            </div>

            <div>
              <Label htmlFor="pacing_type">Pacing Type</Label>
              <Select value={formData.pacing_type} onValueChange={(value) => handleInputChange('pacing_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pacing type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asap">ASAP</SelectItem>
                  <SelectItem value="even">Even</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                How impressions are paced
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="impression_max_type">Impression Max Type</Label>
            <Select value={formData.impression_max_type} onValueChange={(value) => handleInputChange('impression_max_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select impression max type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cap">Cap</SelectItem>
                <SelectItem value="goal">Goal</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              Type of impression limit
            </p>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Advanced Settings"
          sectionKey="advancedSettings"
          description="Path, notes, and status settings"
        >
          <div>
            <Label htmlFor="path">Path</Label>
            <Input
              id="path"
              value={formData.path}
              onChange={(e) => handleInputChange('path', e.target.value)}
              placeholder="URL path for campaign targeting"
            />
            <p className="text-sm text-gray-500 mt-1">
              URL path for campaign targeting (optional)
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this campaign"
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-1">
              Internal notes about this campaign
            </p>
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
          disabled={isSubmitting || !formData.name || !formData.start_date || !(entities.network as any)?.broadstreet_id || !entities.advertiser}
          className="min-w-[120px]"
          data-testid="submit-button"
        >
          {isSubmitting ? 'Creating...' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  );
}
