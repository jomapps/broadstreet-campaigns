'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface AdvertisementCreationFormProps {
  onClose: () => void;
  setIsLoading: (loading: boolean) => void;
}

export default function AdvertisementCreationForm({ onClose, setIsLoading }: AdvertisementCreationFormProps) {
  const entities = useSelectedEntities();
  const router = useRouter();
  const [formData, setFormData] = useState({
    // Required fields
    name: '',
    type: 'image' as 'image' | 'text' | 'video' | 'native',
    
    // Optional fields - empty by default
    preview_url: '',
    target_url: '',
    notes: '',
    active_placement: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basicSettings: false,
    advancedSettings: false,
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.preview_url && !isValidUrl(formData.preview_url)) {
      newErrors.preview_url = 'Please enter a valid URL';
    }

    if (formData.target_url && !isValidUrl(formData.target_url)) {
      newErrors.target_url = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
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

    if (!entities.network) {
      setErrors({ network: 'Please select a network first' });
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      // Build payload with only non-empty optional fields
      const payload: any = {
        name: formData.name.trim(),
        network_id: entities.network.id,
        type: formData.type,
      };

      // Only add optional fields if they have values
      if (entities.advertiser?.id) {
        payload.advertiser_id = entities.advertiser.id;
      }
      
      if (formData.preview_url && formData.preview_url.trim()) {
        payload.preview_url = formData.preview_url.trim();
      }
      
      if (formData.target_url && formData.target_url.trim()) {
        payload.target_url = formData.target_url.trim();
      }
      
      if (formData.notes && formData.notes.trim()) {
        payload.notes = formData.notes.trim();
      }
      
      if (!formData.active_placement) {
        payload.active_placement = formData.active_placement;
      }

      const response = await fetch('/api/create/advertisement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create advertisement');
      }

      const result = await response.json();
      
      // Show success message
      alert(`Advertisement "${result.advertisement.name}" created successfully!`);
      
      // Refresh the page to show the new advertisement
      router.refresh();
      
      onClose();
    } catch (error) {
      console.error('Error creating advertisement:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create advertisement' });
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Network Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Network:</strong> {entities.network?.name}
        </p>
        {entities.advertiser && (
          <p className="text-sm text-blue-800">
            <strong>Advertiser:</strong> {entities.advertiser.name}
          </p>
        )}
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
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !formData.name || !entities.network}
          className="min-w-[120px]"
        >
          {isSubmitting ? 'Creating...' : 'Create Advertisement'}
        </Button>
      </div>

      {/* Required Fields */}
      <div className="mb-6 space-y-4">
        <div>
          <Label htmlFor="name">Advertisement Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Summer Sale Banner"
            className={errors.name ? 'border-red-500' : ''}
            required
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="type">Advertisement Type *</Label>
          <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select advertisement type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="native">Native</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-1">
            Type of advertisement content
          </p>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        <CollapsibleSection
          title="Basic Settings"
          sectionKey="basicSettings"
          description="Preview URL and target URL"
        >
          <div>
            <Label htmlFor="preview_url">Preview URL</Label>
            <Input
              id="preview_url"
              type="url"
              value={formData.preview_url}
              onChange={(e) => handleInputChange('preview_url', e.target.value)}
              placeholder="https://example.com/preview.jpg"
              className={errors.preview_url ? 'border-red-500' : ''}
            />
            {errors.preview_url && <p className="text-sm text-red-500 mt-1">{errors.preview_url}</p>}
            <p className="text-sm text-gray-500 mt-1">
              URL to preview the advertisement (optional)
            </p>
          </div>

          <div>
            <Label htmlFor="target_url">Target URL</Label>
            <Input
              id="target_url"
              type="url"
              value={formData.target_url}
              onChange={(e) => handleInputChange('target_url', e.target.value)}
              placeholder="https://example.com/landing-page"
              className={errors.target_url ? 'border-red-500' : ''}
            />
            {errors.target_url && <p className="text-sm text-red-500 mt-1">{errors.target_url}</p>}
            <p className="text-sm text-gray-500 mt-1">
              URL where users will be directed when clicking the ad (optional)
            </p>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Advanced Settings"
          sectionKey="advancedSettings"
          description="Notes and additional information"
        >
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this advertisement"
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-1">
              Internal notes about this advertisement
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
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !formData.name || !entities.network}
          className="min-w-[120px]"
        >
          {isSubmitting ? 'Creating...' : 'Create Advertisement'}
        </Button>
      </div>
    </form>
  );
}
