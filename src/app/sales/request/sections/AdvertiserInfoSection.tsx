'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AdvertiserInfo {
  company_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  website?: string;
  notes?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

interface AdvertiserInfoSectionProps {
  data?: AdvertiserInfo;
  onChange: (data: Partial<AdvertiserInfo>) => void;
  errors: Record<string, string>;
}

/**
 * Advertiser Information Section
 * Collects company and contact details
 */
export default function AdvertiserInfoSection({
  data = {
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    website: '',
    notes: '',
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
    },
  },
  onChange,
  errors,
}: AdvertiserInfoSectionProps) {
  
  const handleChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '');
      onChange({
        ...data,
        address: {
          ...data?.address,
          [addressField]: value,
        },
      });
    } else {
      onChange({
        ...data,
        [field]: value,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Advertiser Information</h2>
        <p className="text-sm text-gray-600 mb-6">
          Please provide the company and contact information for this advertising request.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Name */}
        <div className="md:col-span-2">
          <Label htmlFor="company_name" className="text-sm font-medium text-gray-700">
            Company Name *
          </Label>
          <Input
            id="company_name"
            type="text"
            value={data.company_name}
            onChange={(e) => handleChange('company_name', e.target.value)}
            className={errors.company_name ? 'border-red-500' : ''}
            placeholder="Enter company name"
          />
          {errors.company_name && (
            <p className="mt-1 text-sm text-red-600">{errors.company_name}</p>
          )}
        </div>

        {/* Contact Person */}
        <div>
          <Label htmlFor="contact_person" className="text-sm font-medium text-gray-700">
            Contact Person *
          </Label>
          <Input
            id="contact_person"
            type="text"
            value={data.contact_person}
            onChange={(e) => handleChange('contact_person', e.target.value)}
            className={errors.contact_person ? 'border-red-500' : ''}
            placeholder="Enter contact person name"
          />
          {errors.contact_person && (
            <p className="mt-1 text-sm text-red-600">{errors.contact_person}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={errors.email ? 'border-red-500' : ''}
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={data?.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="Enter phone number"
          />
        </div>

        {/* Website */}
        <div>
          <Label htmlFor="website" className="text-sm font-medium text-gray-700">
            Website
          </Label>
          <Input
            id="website"
            type="url"
            value={data?.website || ''}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="https://example.com"
          />
        </div>
      </div>

      {/* Address Section */}
      <div>
        <h3 className="text-md font-medium text-gray-900 mb-4">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Street */}
          <div className="md:col-span-2">
            <Label htmlFor="street" className="text-sm font-medium text-gray-700">
              Street Address
            </Label>
            <Input
              id="street"
              type="text"
              value={data?.address?.street || ''}
              onChange={(e) => handleChange('address.street', e.target.value)}
              placeholder="Enter street address"
            />
          </div>

          {/* City */}
          <div>
            <Label htmlFor="city" className="text-sm font-medium text-gray-700">
              City
            </Label>
            <Input
              id="city"
              type="text"
              value={data?.address?.city || ''}
              onChange={(e) => handleChange('address.city', e.target.value)}
              placeholder="Enter city"
            />
          </div>

          {/* State */}
          <div>
            <Label htmlFor="state" className="text-sm font-medium text-gray-700">
              State/Province
            </Label>
            <Input
              id="state"
              type="text"
              value={data?.address?.state || ''}
              onChange={(e) => handleChange('address.state', e.target.value)}
              placeholder="Enter state or province"
            />
          </div>

          {/* Postal Code */}
          <div>
            <Label htmlFor="postal_code" className="text-sm font-medium text-gray-700">
              Postal Code
            </Label>
            <Input
              id="postal_code"
              type="text"
              value={data?.address?.postal_code || ''}
              onChange={(e) => handleChange('address.postal_code', e.target.value)}
              placeholder="Enter postal code"
            />
          </div>

          {/* Country */}
          <div>
            <Label htmlFor="country" className="text-sm font-medium text-gray-700">
              Country
            </Label>
            <Input
              id="country"
              type="text"
              value={data?.address?.country || ''}
              onChange={(e) => handleChange('address.country', e.target.value)}
              placeholder="Enter country"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
