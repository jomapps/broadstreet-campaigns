'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdvertisementCreationFormProps {
  onClose: () => void;
  setIsLoading: (loading: boolean) => void;
}

export default function AdvertisementCreationForm({ onClose, setIsLoading }: AdvertisementCreationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'image' as const,
    preview_url: '',
    target_url: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.preview_url.trim()) {
      newErrors.preview_url = 'Preview URL is required';
    } else if (!isValidUrl(formData.preview_url)) {
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

  const handleInputChange = (field: string, value: string) => {
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
        target_url: formData.target_url || undefined,
      };

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Advertisement Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter advertisement name"
            className={errors.name ? 'border-red-500' : ''}
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
        </div>

        <div>
          <Label htmlFor="preview_url">Preview URL *</Label>
          <Input
            id="preview_url"
            type="url"
            value={formData.preview_url}
            onChange={(e) => handleInputChange('preview_url', e.target.value)}
            placeholder="https://example.com/preview.jpg"
            className={errors.preview_url ? 'border-red-500' : ''}
          />
          {errors.preview_url && <p className="text-sm text-red-500 mt-1">{errors.preview_url}</p>}
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
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes about this advertisement"
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
          {isSubmitting ? 'Creating...' : 'Create Advertisement'}
        </Button>
      </div>
    </form>
  );
}
