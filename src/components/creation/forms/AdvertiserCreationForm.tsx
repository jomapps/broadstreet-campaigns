'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFilters } from '@/contexts/FilterContext';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, X, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface AdvertiserCreationFormProps {
  onClose: () => void;
  setIsLoading: (loading: boolean) => void;
}

interface AdminContact {
  name: string;
  email: string;
}

export default function AdvertiserCreationForm({ onClose, setIsLoading }: AdvertiserCreationFormProps) {
  const entities = useSelectedEntities();
  const { setAdvertisers } = useFilters();
  const router = useRouter();
  const [formData, setFormData] = useState({
    // Required fields
    name: '',
    
    // Optional fields - empty by default
    web_home_url: '',
    notes: '',
  });
  const [adminContacts, setAdminContacts] = useState<AdminContact[]>([]);
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
      };

      // Only add optional fields if they have values
      if (formData.web_home_url && formData.web_home_url.trim()) {
        payload.web_home_url = formData.web_home_url.trim();
      }
      
      if (formData.notes && formData.notes.trim()) {
        payload.notes = formData.notes.trim();
      }
      
      if (adminContacts.length > 0) {
        payload.admins = adminContacts.filter(contact => contact.name && contact.email);
      }

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

      // Show success message
      alert(`Advertiser "${result.advertiser.name}" created successfully!`);

      // Immediately reload advertisers for the current network so the list updates without a full reload
      try {
        if (entities.network) {
          const listRes = await fetch(`/api/advertisers?network_id=${entities.network.id}`, { cache: 'no-store' });
          if (listRes.ok) {
            const listData = await listRes.json();
            setAdvertisers(listData.advertisers || []);
          }
        }
      } catch (e) {
        // Non-fatal: fallback to a soft refresh
        console.info('Post-create advertisers reload failed; falling back to refresh');
      }
      
      // Soft refresh for any server components
      router.refresh();
      
      onClose();
    } catch (error) {
      console.error('Error creating advertiser:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create advertiser' });
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full" data-testid="advertiser-creation-form">
      {/* Network Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Network:</strong> {entities.network?.name}
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
          disabled={isSubmitting || !formData.name || !entities.network}
          className="min-w-[120px]"
          data-testid="submit-button"
        >
          {isSubmitting ? 'Creating...' : 'Create Advertiser'}
        </Button>
      </div>

      {/* Required Field */}
      <div className="mb-6">
        <Label htmlFor="name">Advertiser Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="e.g., Acme Corporation"
          className={errors.name ? 'border-red-500' : ''}
          required
          data-testid="advertiser-name-input"
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* Collapsible Sections */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        <CollapsibleSection
          title="Basic Settings"
          sectionKey="basicSettings"
          description="Website URL and notes"
        >
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
            <p className="text-sm text-gray-500 mt-1">
              The advertiser&apos;s main website URL
            </p>
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
            <p className="text-sm text-gray-500 mt-1">
              Internal notes about this advertiser
            </p>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Advanced Settings"
          sectionKey="advancedSettings"
          description="Admin contacts and additional information"
        >
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
          disabled={isSubmitting || !formData.name || !entities.network}
          className="min-w-[120px]"
          data-testid="submit-button"
        >
          {isSubmitting ? 'Creating...' : 'Create Advertiser'}
        </Button>
      </div>
    </form>
  );
}
