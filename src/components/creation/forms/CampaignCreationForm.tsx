'use client';

import { useState } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

interface CampaignCreationFormProps {
  onClose: () => void;
  setIsLoading: (loading: boolean) => void;
}

export default function CampaignCreationForm({ onClose, setIsLoading }: CampaignCreationFormProps) {
  const { selectedNetwork, selectedAdvertiser } = useFilters();
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    weight: 1,
    max_impression_count: '',
    display_type: 'no_repeat' as const,
    pacing_type: 'asap' as const,
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (formData.end_date && formData.start_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    if (formData.weight <= 0) {
      newErrors.weight = 'Weight must be greater than 0';
    }

    if (formData.max_impression_count && parseInt(formData.max_impression_count) <= 0) {
      newErrors.max_impression_count = 'Max impression count must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!selectedNetwork) {
      setErrors({ network: 'Please select a network first' });
      return;
    }

    if (!selectedAdvertiser) {
      setErrors({ advertiser: 'Please select an advertiser first' });
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        network_id: selectedNetwork.id,
        advertiser_id: selectedAdvertiser.id,
        max_impression_count: formData.max_impression_count ? parseInt(formData.max_impression_count) : undefined,
        end_date: formData.end_date || undefined,
      };

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
      
      onClose();
    } catch (error) {
      console.error('Error creating campaign:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create campaign' });
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  if (!selectedNetwork || !selectedAdvertiser) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements Not Met</h3>
        <p className="text-gray-600 mb-4">
          Please select both a network and an advertiser from the sidebar filters before creating a campaign.
        </p>
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Context Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Network:</strong> {selectedNetwork.name}
        </p>
        <p className="text-sm text-blue-800">
          <strong>Advertiser:</strong> {selectedAdvertiser.name}
        </p>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Campaign Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter campaign name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Start Date *</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              className={errors.start_date ? 'border-red-500' : ''}
            />
            {errors.start_date && <p className="text-sm text-red-500 mt-1">{errors.start_date}</p>}
          </div>

          <div>
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
              className={errors.end_date ? 'border-red-500' : ''}
            />
            {errors.end_date && <p className="text-sm text-red-500 mt-1">{errors.end_date}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weight">Weight *</Label>
            <Input
              id="weight"
              type="number"
              min="1"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', parseInt(e.target.value) || 1)}
              className={errors.weight ? 'border-red-500' : ''}
            />
            {errors.weight && <p className="text-sm text-red-500 mt-1">{errors.weight}</p>}
          </div>

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
          </div>
        </div>

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
          </div>
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
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
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
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? 'Creating...' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  );
}
