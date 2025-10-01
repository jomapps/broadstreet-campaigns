'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import AdvertiserInfoSection from './sections/AdvertiserInfoSection';
import AdvertisementSection from './sections/AdvertisementSection';
import AIIntelligenceSection from './sections/AIIntelligenceSection';
import { Button } from '@/components/ui/button';

interface FormData {
  // Advertiser Info
  advertiser_name: string;
  advertiser_id: string;
  contract_id: string;
  contract_start_date: string;
  contract_end_date: string;
  campaign_name: string;

  // Advertisement Info
  advertisements: Array<{
    id: string;
    image_url: string;
    image_name: string;
    image_alt_text: string;
    width: number;
    height: number;
    file_size: number;
    mime_type: string;
    size_coding: 'SQ' | 'PT' | 'LS';
    advertisement_name: string;
    target_url: string;
    html_code?: string;
    r2_key: string;
    uploaded_at: Date;
  }>;
  ad_areas_sold: string;
  themes: string;

  // AI Intelligence
  keywords: string;
  info_url: string;
  extra_info: string;
}

/**
 * Main Request Form Component
 * Multi-step form for creating advertising requests
 */
export default function RequestForm() {
  const { user } = useUser();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    // Advertiser Info
    advertiser_name: '',
    advertiser_id: '',
    contract_id: '',
    contract_start_date: '',
    contract_end_date: '',
    campaign_name: '',

    // Advertisement Info
    advertisements: [],
    ad_areas_sold: '',
    themes: '',

    // AI Intelligence
    keywords: '',
    info_url: '',
    extra_info: '',
  });

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Advertiser Info validation
      if (!formData.advertiser_name.trim()) {
        newErrors.advertiser_name = 'Advertiser name is required';
      }
      if (!formData.advertiser_id.trim()) {
        newErrors.advertiser_id = 'Advertiser ID is required';
      }
      if (!formData.contract_id.trim()) {
        newErrors.contract_id = 'Contract ID is required';
      }
      if (!formData.contract_start_date) {
        newErrors.contract_start_date = 'Contract start date is required';
      }
      if (!formData.campaign_name.trim()) {
        newErrors.campaign_name = 'Campaign name is required';
      }

      // Validate end date is after start date (only if end date is provided)
      if (formData.contract_start_date && formData.contract_end_date && formData.contract_end_date.trim()) {
        const start = new Date(formData.contract_start_date);
        const end = new Date(formData.contract_end_date);
        if (end <= start) {
          newErrors.contract_end_date = 'End date must be after start date';
        }
      }
    }

    if (step === 2) {
      // Advertisement Info validation
      if (formData.advertisements.length === 0) {
        newErrors.advertisements = 'At least one advertisement is required';
      }

      // Validate each advertisement
      formData.advertisements.forEach((ad, index) => {
        if (!ad.target_url || ad.target_url === 'https://') {
          newErrors[`ad_${index}_target_url`] = 'Target URL is required';
        }
      });

      // Validate ad areas sold
      if (!formData.ad_areas_sold.trim()) {
        newErrors.ad_areas_sold = 'At least one ad area is required';
      }
    }

    if (step === 3) {
      // AI Intelligence validation (all optional, but validate URL format if provided)
      if (formData.info_url && formData.info_url !== 'https://' && formData.info_url.trim()) {
        try {
          new URL(formData.info_url);
        } catch {
          newErrors.info_url = 'Please enter a valid URL';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep((currentStep + 1) as 1 | 2 | 3);
      }
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (!user) {
      setErrors({ submit: 'You must be logged in to submit a request' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse comma-separated fields
      const ad_areas_sold = formData.ad_areas_sold
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const themes = formData.themes
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const keywords = formData.keywords
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Prepare request payload
      const payload = {
        // User info from Clerk
        created_by_user_id: user.id,
        created_by_user_name: user.fullName || user.username || 'Unknown User',
        created_by_user_email: user.primaryEmailAddress?.emailAddress || '',

        // Advertiser Info
        advertiser_name: formData.advertiser_name,
        advertiser_id: formData.advertiser_id,
        contract_id: formData.contract_id,
        contract_start_date: formData.contract_start_date,
        contract_end_date: formData.contract_end_date,
        campaign_name: formData.campaign_name,

        // Advertisement Info (remove temporary 'id' field)
        advertisements: formData.advertisements.map(ad => ({
          image_url: ad.image_url,
          image_name: ad.image_name,
          image_alt_text: ad.image_alt_text,
          width: ad.width,
          height: ad.height,
          file_size: ad.file_size,
          mime_type: ad.mime_type,
          size_coding: ad.size_coding,
          advertisement_name: ad.advertisement_name,
          target_url: ad.target_url,
          html_code: ad.html_code || '',
          r2_key: ad.r2_key,
          uploaded_at: ad.uploaded_at,
        })),
        ad_areas_sold,
        themes: themes.length > 0 ? themes : undefined,

        // AI Intelligence
        keywords: keywords.length > 0 ? keywords : undefined,
        info_url: formData.info_url && formData.info_url !== 'https://' ? formData.info_url : undefined,
        extra_info: formData.extra_info || undefined,

        // Default status
        status: 'new',
      };

      const response = await fetch('/api/advertising-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create request');
      }

      const result = await response.json();

      // Redirect to success page or list
      router.push('/sales/open-list');
    } catch (error) {
      console.error('Error creating request:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create request',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${currentStep === 1 ? 'text-blue-600' : currentStep > 1 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              currentStep === 1 ? 'bg-blue-600 text-white' : currentStep > 1 ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}>
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <span className="ml-3 font-medium">Advertiser Info</span>
          </div>

          <div className={`flex-1 h-1 mx-4 ${currentStep > 1 ? 'bg-green-600' : 'bg-gray-200'}`} />

          <div className={`flex items-center ${currentStep === 2 ? 'text-blue-600' : currentStep > 2 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              currentStep === 2 ? 'bg-blue-600 text-white' : currentStep > 2 ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}>
              {currentStep > 2 ? '✓' : '2'}
            </div>
            <span className="ml-3 font-medium">Advertisement</span>
          </div>

          <div className={`flex-1 h-1 mx-4 ${currentStep > 2 ? 'bg-green-600' : 'bg-gray-200'}`} />

          <div className={`flex items-center ${currentStep === 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              3
            </div>
            <span className="ml-3 font-medium">AI Intelligence</span>
          </div>
        </div>
      </div>

      {/* Form sections */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {currentStep === 1 && (
          <AdvertiserInfoSection
            data={{
              advertiser_name: formData.advertiser_name,
              advertiser_id: formData.advertiser_id,
              contract_id: formData.contract_id,
              contract_start_date: formData.contract_start_date,
              contract_end_date: formData.contract_end_date,
              campaign_name: formData.campaign_name,
            }}
            onChange={(data) => setFormData({ ...formData, ...data })}
            errors={errors}
          />
        )}

        {currentStep === 2 && (
          <AdvertisementSection
            data={{
              advertisements: formData.advertisements,
              ad_areas_sold: formData.ad_areas_sold,
              themes: formData.themes,
            }}
            onChange={(data) => setFormData({ ...formData, ...data })}
            errors={errors}
            advertiserInfo={{
              advertiser_name: formData.advertiser_name,
              advertiser_id: formData.advertiser_id,
              contract_id: formData.contract_id,
              contract_start_date: formData.contract_start_date,
              contract_end_date: formData.contract_end_date,
              campaign_name: formData.campaign_name,
            }}
          />
        )}

        {currentStep === 3 && (
          <AIIntelligenceSection
            data={{
              keywords: formData.keywords,
              info_url: formData.info_url,
              extra_info: formData.extra_info,
            }}
            onChange={(data) => setFormData({ ...formData, ...data })}
            errors={errors}
          />
        )}

        {/* Form actions */}
        <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting}
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {errors.submit && (
              <p className="text-sm text-red-600">{errors.submit}</p>
            )}

            {currentStep < 3 ? (
              <Button onClick={handleNext} disabled={isSubmitting}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Request'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}