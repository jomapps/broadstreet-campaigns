'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AIIntelligenceData {
  keywords: string;
  info_url: string;
  extra_info: string;
}

interface AIIntelligenceSectionProps {
  data: AIIntelligenceData;
  onChange: (data: Partial<AIIntelligenceData>) => void;
  errors: Record<string, string>;
}

/**
 * AI Intelligence Section
 * Optional fields for keywords, info URL, and extra information
 */
export default function AIIntelligenceSection({
  data,
  onChange,
  errors,
}: AIIntelligenceSectionProps) {
  const handleChange = (field: keyof AIIntelligenceData, value: string) => {
    onChange({ [field]: value });
  };

  // Handle info_url input - auto-clean duplicate https://
  const handleInfoUrlChange = (value: string) => {
    // Remove duplicate https:// if user types it
    const cleanValue = value.replace(/^https?:\/\/(https?:\/\/)/i, 'https://');
    handleChange('info_url', cleanValue);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Intelligence</h2>
        <p className="text-sm text-gray-600 mb-6">
          Optional information for targeting and optimization.
        </p>
      </div>

      <div className="space-y-6">
        {/* Keywords */}
        <div>
          <Label htmlFor="keywords" className="text-sm font-medium text-gray-700">
            Keywords (Optional, comma-separated)
          </Label>
          <Input
            id="keywords"
            type="text"
            value={data.keywords}
            onChange={(e) => handleChange('keywords', e.target.value)}
            placeholder="e.g., travel, tourism, vacation, hotels"
            className={errors.keywords ? 'border-red-500' : ''}
          />
          {errors.keywords && (
            <p className="mt-1 text-sm text-red-600">{errors.keywords}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Keywords for targeting and categorization, separated by commas
          </p>
        </div>

        {/* Info URL */}
        <div>
          <Label htmlFor="info_url" className="text-sm font-medium text-gray-700">
            Info URL (Optional)
          </Label>
          <Input
            id="info_url"
            type="url"
            value={data.info_url}
            onChange={(e) => handleInfoUrlChange(e.target.value)}
            placeholder="https://example.com/campaign-info"
            className={errors.info_url ? 'border-red-500' : ''}
          />
          {errors.info_url && (
            <p className="mt-1 text-sm text-red-600">{errors.info_url}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            URL with additional campaign information
          </p>
        </div>

        {/* Extra Info */}
        <div>
          <Label htmlFor="extra_info" className="text-sm font-medium text-gray-700">
            Extra Info (Optional)
          </Label>
          <Textarea
            id="extra_info"
            value={data.extra_info}
            onChange={(e) => handleChange('extra_info', e.target.value)}
            placeholder="Additional notes or information from the sales team..."
            rows={5}
            className={errors.extra_info ? 'border-red-500' : ''}
          />
          {errors.extra_info && (
            <p className="mt-1 text-sm text-red-600">{errors.extra_info}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Any additional information that may be useful
          </p>
        </div>
      </div>
    </div>
  );
}