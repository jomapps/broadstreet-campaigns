'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Autosuggest, { AutosuggestOption } from '@/components/ui/autosuggest';

interface AdvertiserInfo {
  advertiser_name: string;
  advertiser_id: string;
  contract_id: string;
  contract_start_date: string;
  contract_end_date: string;
  campaign_name: string;
}

interface AdvertiserInfoSectionProps {
  data: AdvertiserInfo;
  onChange: (data: Partial<AdvertiserInfo>) => void;
  errors: Record<string, string>;
}

/**
 * Advertiser Information Section
 * Required fields from sales team: advertiser, IDs, contract dates, campaign name
 */
export default function AdvertiserInfoSection({
  data,
  onChange,
  errors,
}: AdvertiserInfoSectionProps) {
  // Search function for autosuggest
  const searchAdvertisers = async (query: string): Promise<AutosuggestOption[]> => {
    try {
      const response = await fetch(`/api/advertisers/search?q=${encodeURIComponent(query)}&networkId=9396`);
      if (!response.ok) throw new Error('Search failed');

      const result = await response.json();
      return result.advertisers || [];
    } catch (error) {
      console.error('Advertiser search error:', error);
      return [];
    }
  };

  // Handle advertiser selection
  const handleAdvertiserSelect = (option: AutosuggestOption | null) => {
    if (option) {
      onChange({ advertiser_name: option.name });
    }
  };

  const handleChange = (field: keyof AdvertiserInfo, value: string) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Advertiser Information</h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter the advertiser and contract details from the sales team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Advertiser Name with Autosuggest */}
        <div className="md:col-span-2">
          <Label htmlFor="advertiser_name" className="text-sm font-medium text-gray-700">
            Advertiser *
          </Label>
          <Autosuggest
            value={data.advertiser_name}
            onChange={(value) => handleChange('advertiser_name', value)}
            onSelect={handleAdvertiserSelect}
            searchFunction={searchAdvertisers}
            placeholder="Type to search or enter new advertiser name"
            className={errors.advertiser_name ? 'border-red-500' : ''}
          />
          {errors.advertiser_name && (
            <p className="mt-1 text-sm text-red-600">{errors.advertiser_name}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Search existing advertisers or enter a new name
          </p>
        </div>

        {/* Advertiser ID */}
        <div>
          <Label htmlFor="advertiser_id" className="text-sm font-medium text-gray-700">
            Advertiser ID *
          </Label>
          <Input
            id="advertiser_id"
            type="text"
            value={data.advertiser_id}
            onChange={(e) => handleChange('advertiser_id', e.target.value)}
            className={errors.advertiser_id ? 'border-red-500' : ''}
            placeholder="Enter sales department advertiser ID"
          />
          {errors.advertiser_id && (
            <p className="mt-1 text-sm text-red-600">{errors.advertiser_id}</p>
          )}
        </div>

        {/* Contract ID */}
        <div>
          <Label htmlFor="contract_id" className="text-sm font-medium text-gray-700">
            Contract ID *
          </Label>
          <Input
            id="contract_id"
            type="text"
            value={data.contract_id}
            onChange={(e) => handleChange('contract_id', e.target.value)}
            className={errors.contract_id ? 'border-red-500' : ''}
            placeholder="Enter contract identifier"
          />
          {errors.contract_id && (
            <p className="mt-1 text-sm text-red-600">{errors.contract_id}</p>
          )}
        </div>

        {/* Contract Start Date */}
        <div>
          <Label htmlFor="contract_start_date" className="text-sm font-medium text-gray-700">
            Contract Start Date *
          </Label>
          <Input
            id="contract_start_date"
            type="date"
            value={data.contract_start_date}
            onChange={(e) => handleChange('contract_start_date', e.target.value)}
            className={errors.contract_start_date ? 'border-red-500' : ''}
          />
          {errors.contract_start_date && (
            <p className="mt-1 text-sm text-red-600">{errors.contract_start_date}</p>
          )}
        </div>

        {/* Contract End Date */}
        <div>
          <Label htmlFor="contract_end_date" className="text-sm font-medium text-gray-700">
            Contract End Date
          </Label>
          <Input
            id="contract_end_date"
            type="date"
            value={data.contract_end_date}
            onChange={(e) => handleChange('contract_end_date', e.target.value)}
            className={errors.contract_end_date ? 'border-red-500' : ''}
          />
          {errors.contract_end_date && (
            <p className="mt-1 text-sm text-red-600">{errors.contract_end_date}</p>
          )}
        </div>

        {/* Campaign Name */}
        <div className="md:col-span-2">
          <Label htmlFor="campaign_name" className="text-sm font-medium text-gray-700">
            Campaign Name *
          </Label>
          <Input
            id="campaign_name"
            type="text"
            value={data.campaign_name}
            onChange={(e) => handleChange('campaign_name', e.target.value)}
            className={errors.campaign_name ? 'border-red-500' : ''}
            placeholder="Enter campaign name from sales team"
          />
          {errors.campaign_name && (
            <p className="mt-1 text-sm text-red-600">{errors.campaign_name}</p>
          )}
        </div>
      </div>
    </div>
  );
}