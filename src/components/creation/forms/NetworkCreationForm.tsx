'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface NetworkCreationFormProps {
  onClose: () => void;
  setIsLoading: (loading: boolean) => void;
}

export default function NetworkCreationForm({ onClose, setIsLoading }: NetworkCreationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    web_home_url: '',
    path: '',
    valet_active: false,
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.path.trim()) {
      newErrors.path = 'Path is required';
    }

    if (formData.web_home_url && !isValidUrl(formData.web_home_url)) {
      newErrors.web_home_url = 'Please enter a valid URL';
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

  const handleInputChange = (field: string, value: string | boolean) => {
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

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        web_home_url: formData.web_home_url || undefined,
        notes: formData.notes || undefined,
      };

      const response = await fetch('/api/create/network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create network');
      }

      const result = await response.json();
      
      // Show success message
      alert(`Network "${result.network.name}" created successfully!`);
      
      onClose();
    } catch (error) {
      console.error('Error creating network:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create network' });
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Network Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter network name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="path">Path *</Label>
          <Input
            id="path"
            value={formData.path}
            onChange={(e) => handleInputChange('path', e.target.value)}
            placeholder="Enter network path (e.g., schwulissimo, travelm)"
            className={errors.path ? 'border-red-500' : ''}
          />
          {errors.path && <p className="text-sm text-red-500 mt-1">{errors.path}</p>}
        </div>

        <div>
          <Label htmlFor="web_home_url">Website URL</Label>
          <Input
            id="web_home_url"
            type="url"
            value={formData.web_home_url}
            onChange={(e) => handleInputChange('web_home_url', e.target.value)}
            placeholder="https://example.com"
            className={errors.web_home_url ? 'border-red-500' : ''}
          />
          {errors.web_home_url && <p className="text-sm text-red-500 mt-1">{errors.web_home_url}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="valet_active"
            checked={formData.valet_active}
            onCheckedChange={(checked) => handleInputChange('valet_active', checked as boolean)}
          />
          <Label htmlFor="valet_active">Valet Active</Label>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes about this network"
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
          {isSubmitting ? 'Creating...' : 'Create Network'}
        </Button>
      </div>
    </form>
  );
}
