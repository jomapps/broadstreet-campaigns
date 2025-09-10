'use client';

import { useState } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, X, AlertCircle } from 'lucide-react';

interface AdvertiserCreationFormProps {
  onClose: () => void;
  setIsLoading: (loading: boolean) => void;
}

interface AdminContact {
  name: string;
  email: string;
}

export default function AdvertiserCreationForm({ onClose, setIsLoading }: AdvertiserCreationFormProps) {
  const { selectedNetwork } = useFilters();
  const [formData, setFormData] = useState({
    name: '',
    web_home_url: '',
    notes: '',
  });
  const [adminContacts, setAdminContacts] = useState<AdminContact[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.web_home_url && !isValidUrl(formData.web_home_url)) {
      newErrors.web_home_url = 'Please enter a valid URL';
    }

    // Validate admin contacts
    adminContacts.forEach((contact, index) => {
      if (contact.name && !contact.email) {
        newErrors[`admin_${index}_email`] = 'Email is required when name is provided';
      }
      if (contact.email && !isValidEmail(contact.email)) {
        newErrors[`admin_${index}_email`] = 'Please enter a valid email address';
      }
    });

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

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addAdminContact = () => {
    setAdminContacts(prev => [...prev, { name: '', email: '' }]);
  };

  const removeAdminContact = (index: number) => {
    setAdminContacts(prev => prev.filter((_, i) => i !== index));
  };

  const updateAdminContact = (index: number, field: keyof AdminContact, value: string) => {
    setAdminContacts(prev => prev.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    ));
    
    // Clear error when user starts typing
    const errorKey = `admin_${index}_email`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
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

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        network_id: selectedNetwork.id,
        admins: adminContacts.filter(contact => contact.name && contact.email),
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
      
      // Show success message (you could use a toast here)
      alert(`Advertiser "${result.advertiser.name}" created successfully!`);
      
      onClose();
    } catch (error) {
      console.error('Error creating advertiser:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create advertiser' });
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  if (!selectedNetwork) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Network Required</h3>
        <p className="text-gray-600 mb-4">
          Please select a network from the sidebar filters before creating an advertiser.
        </p>
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Network Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Network:</strong> {selectedNetwork.name}
        </p>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter advertiser name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
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

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes about this advertiser"
            rows={3}
          />
        </div>
      </div>

      {/* Admin Contacts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>Admin Contacts</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAdminContact}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Contact</span>
          </Button>
        </div>

        {adminContacts.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No admin contacts added</p>
        ) : (
          <div className="space-y-3">
            {adminContacts.map((contact, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor={`admin_${index}_name`}>Name</Label>
                      <Input
                        id={`admin_${index}_name`}
                        value={contact.name}
                        onChange={(e) => updateAdminContact(index, 'name', e.target.value)}
                        placeholder="Contact name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`admin_${index}_email`}>Email</Label>
                      <Input
                        id={`admin_${index}_email`}
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateAdminContact(index, 'email', e.target.value)}
                        placeholder="contact@example.com"
                        className={errors[`admin_${index}_email`] ? 'border-red-500' : ''}
                      />
                      {errors[`admin_${index}_email`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`admin_${index}_email`]}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAdminContact(index)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
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
          {isSubmitting ? 'Creating...' : 'Create Advertiser'}
        </Button>
      </div>
    </form>
  );
}
