'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface CreateAdvertiserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (advertiser: {
    id: string;
    name: string;
    website?: string;
    type: 'local';
  }) => void;
  initialName?: string;
}

interface AdvertiserFormData {
  name: string;
  web_home_url: string;
  notes: string;
  admins: Array<{
    name: string;
    email: string;
  }>;
}

export default function CreateAdvertiserModal({
  isOpen,
  onClose,
  onSuccess,
  initialName = '',
}: CreateAdvertiserModalProps) {
  const [formData, setFormData] = useState<AdvertiserFormData>({
    name: initialName,
    web_home_url: '',
    notes: '',
    admins: [{ name: '', email: '' }],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  const handleClose = () => {
    setFormData({
      name: initialName,
      web_home_url: '',
      notes: '',
      admins: [{ name: '', email: '' }],
    });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }

    // Validate admins if provided
    formData.admins.forEach((admin, index) => {
      if (admin.name && !admin.email) {
        newErrors[`admin_email_${index}`] = 'Email is required when name is provided';
      }
      if (admin.email && !admin.name) {
        newErrors[`admin_name_${index}`] = 'Name is required when email is provided';
      }
      if (admin.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin.email)) {
        newErrors[`admin_email_${index}`] = 'Please enter a valid email address';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Filter out empty admins
      const validAdmins = formData.admins.filter(admin => 
        admin.name.trim() && admin.email.trim()
      );

      const payload = {
        name: formData.name.trim(),
        networkId: 9396, // Default network ID from user preferences
        webHomeUrl: formData.web_home_url.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        admins: validAdmins.length > 0 ? validAdmins : undefined,
      };

      const response = await fetch('/api/create/advertiser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create advertiser');
      }

      const result = await response.json();
      
      // Call success callback with the created advertiser
      onSuccess({
        id: result.advertiser.mongo_id || result.advertiser._id,
        name: result.advertiser.name,
        website: result.advertiser.web_home_url,
        type: 'local',
      });

      handleClose();
    } catch (error) {
      console.error('Error creating advertiser:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create advertiser',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle admin field changes
  const handleAdminChange = (index: number, field: 'name' | 'email', value: string) => {
    const newAdmins = [...formData.admins];
    newAdmins[index] = { ...newAdmins[index], [field]: value };
    setFormData({ ...formData, admins: newAdmins });
  };

  // Add new admin field
  const addAdminField = () => {
    setFormData({
      ...formData,
      admins: [...formData.admins, { name: '', email: '' }],
    });
  };

  // Remove admin field
  const removeAdminField = (index: number) => {
    if (formData.admins.length > 1) {
      const newAdmins = formData.admins.filter((_, i) => i !== index);
      setFormData({ ...formData, admins: newAdmins });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Advertiser</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Company Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="Enter company name"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Website */}
          <div>
            <Label htmlFor="web_home_url" className="text-sm font-medium text-gray-700">
              Website
            </Label>
            <Input
              id="web_home_url"
              type="url"
              value={formData.web_home_url}
              onChange={(e) => setFormData({ ...formData, web_home_url: e.target.value })}
              placeholder="https://example.com"
              disabled={isSubmitting}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this advertiser"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Admins */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Admin Contacts (Optional)
            </Label>
            <div className="space-y-3 mt-2">
              {formData.admins.map((admin, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={admin.name}
                      onChange={(e) => handleAdminChange(index, 'name', e.target.value)}
                      placeholder="Admin name"
                      className={errors[`admin_name_${index}`] ? 'border-red-500' : ''}
                      disabled={isSubmitting}
                    />
                    {errors[`admin_name_${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`admin_name_${index}`]}</p>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="email"
                      value={admin.email}
                      onChange={(e) => handleAdminChange(index, 'email', e.target.value)}
                      placeholder="admin@example.com"
                      className={errors[`admin_email_${index}`] ? 'border-red-500' : ''}
                      disabled={isSubmitting}
                    />
                    {errors[`admin_email_${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`admin_email_${index}`]}</p>
                    )}
                  </div>
                  {formData.admins.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAdminField(index)}
                      disabled={isSubmitting}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAdminField}
                disabled={isSubmitting}
              >
                Add Admin Contact
              </Button>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Advertiser
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
