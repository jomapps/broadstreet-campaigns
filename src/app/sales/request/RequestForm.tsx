'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import AdvertiserInfoSection from './sections/AdvertiserInfoSection';
import AdvertisementSection from './sections/AdvertisementSection';
import AIIntelligenceSection from './sections/AIIntelligenceSection';
import FormActions from './sections/FormActions';
import { IAdvertisingRequest } from '@/lib/models/advertising-request';

interface RequestFormProps {
  onSubmit: (requestId: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
}

/**
 * Main Request Form Component
 * Comprehensive form for creating advertising requests with all sections
 */
export default function RequestForm({
  onSubmit,
  onCancel,
  isSubmitting,
  setIsSubmitting,
}: RequestFormProps) {
  const { user } = useUser();
  
  // Form state for all sections
  const [formData, setFormData] = useState<Partial<IAdvertisingRequest>>({
    advertiser_info: {
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      website: '',
      address: {
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
      },
    },
    advertisement: {
      name: '',
      description: '',
      target_url: '',
      target_audience: '',
      campaign_goals: '',
      budget_range: '',
      preferred_zones: [],
      image_files: [],
    },
    ai_intelligence: {
      target_demographics: '',
      interests: [],
      behavioral_patterns: '',
      optimal_timing: '',
      content_preferences: '',
      competitive_analysis: '',
      performance_predictions: '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState<'advertiser' | 'advertisement' | 'ai'>('advertiser');

  const updateFormData = (section: keyof IAdvertisingRequest, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }));
  };

  const validateSection = (section: string): boolean => {
    const newErrors: Record<string, string> = {};

    if (section === 'advertiser') {
      if (!formData.advertiser_info?.company_name) {
        newErrors['company_name'] = 'Company name is required';
      }
      if (!formData.advertiser_info?.contact_person) {
        newErrors['contact_person'] = 'Contact person is required';
      }
      if (!formData.advertiser_info?.email) {
        newErrors['email'] = 'Email is required';
      }
    }

    if (section === 'advertisement') {
      if (!formData.advertisement?.name) {
        newErrors['ad_name'] = 'Advertisement name is required';
      }
      if (!formData.advertisement?.description) {
        newErrors['ad_description'] = 'Advertisement description is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateSection(currentSection)) {
      if (currentSection === 'advertiser') {
        setCurrentSection('advertisement');
      } else if (currentSection === 'advertisement') {
        setCurrentSection('ai');
      }
    }
  };

  const handlePrevious = () => {
    if (currentSection === 'ai') {
      setCurrentSection('advertisement');
    } else if (currentSection === 'advertisement') {
      setCurrentSection('advertiser');
    }
  };

  const handleSubmit = async () => {
    if (!validateSection(currentSection)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/advertising-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create request');
      }

      const result = await response.json();
      onSubmit(result.request._id);
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
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${currentSection === 'advertiser' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentSection === 'advertiser' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <span className="ml-2 font-medium">Advertiser Info</span>
          </div>
          <div className={`flex items-center ${currentSection === 'advertisement' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentSection === 'advertisement' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span className="ml-2 font-medium">Advertisement</span>
          </div>
          <div className={`flex items-center ${currentSection === 'ai' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentSection === 'ai' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              3
            </div>
            <span className="ml-2 font-medium">AI Intelligence</span>
          </div>
        </div>
      </div>

      {/* Form sections */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {currentSection === 'advertiser' && (
          <AdvertiserInfoSection
            data={formData.advertiser_info}
            onChange={(data) => updateFormData('advertiser_info', data)}
            errors={errors}
          />
        )}

        {currentSection === 'advertisement' && (
          <AdvertisementSection
            data={formData.advertisement}
            onChange={(data) => updateFormData('advertisement', data)}
            errors={errors}
          />
        )}

        {currentSection === 'ai' && (
          <AIIntelligenceSection
            data={formData.ai_intelligence}
            onChange={(data) => updateFormData('ai_intelligence', data)}
            errors={errors}
          />
        )}

        {/* Form actions */}
        <FormActions
          currentSection={currentSection}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSubmit={handleSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
          submitError={errors.submit}
        />
      </div>
    </div>
  );
}
