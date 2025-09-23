'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AIIntelligence {
  target_demographics?: string;
  interests?: string[];
  behavioral_patterns?: string;
  optimal_timing?: string;
  content_preferences?: string;
  competitive_analysis?: string;
  performance_predictions?: string;
}

interface AIIntelligenceSectionProps {
  data?: AIIntelligence;
  onChange: (data: Partial<AIIntelligence>) => void;
  errors: Record<string, string>;
}

/**
 * AI Intelligence Section
 * Collects AI-driven insights and targeting information
 */
export default function AIIntelligenceSection({
  data = {
    target_demographics: '',
    interests: [],
    behavioral_patterns: '',
    optimal_timing: '',
    content_preferences: '',
    competitive_analysis: '',
    performance_predictions: '',
  },
  onChange,
  errors,
}: AIIntelligenceSectionProps) {
  const [newInterest, setNewInterest] = useState('');

  const handleChange = (field: string, value: string | string[]) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const addInterest = () => {
    if (newInterest.trim() && !(data?.interests || []).includes(newInterest.trim())) {
      handleChange('interests', [...(data?.interests || []), newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (index: number) => {
    const newInterests = (data?.interests || []).filter((_, i) => i !== index);
    handleChange('interests', newInterests);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Intelligence & Targeting</h2>
        <p className="text-sm text-gray-600 mb-6">
          Provide insights and preferences to help optimize the advertising campaign using AI-driven targeting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Target Demographics */}
        <div className="md:col-span-2">
          <Label htmlFor="target_demographics" className="text-sm font-medium text-gray-700">
            Target Demographics
          </Label>
          <Input
            id="target_demographics"
            type="text"
            value={data?.target_demographics || ''}
            onChange={(e) => handleChange('target_demographics', e.target.value)}
            placeholder="e.g., Adults 25-45, Urban professionals, High income"
          />
          <p className="mt-1 text-xs text-gray-500">
            Describe the ideal demographic profile for this advertisement
          </p>
        </div>

        {/* Optimal Timing */}
        <div>
          <Label htmlFor="optimal_timing" className="text-sm font-medium text-gray-700">
            Optimal Timing
          </Label>
          <Input
            id="optimal_timing"
            type="text"
            value={data?.optimal_timing || ''}
            onChange={(e) => handleChange('optimal_timing', e.target.value)}
            placeholder="e.g., Weekdays 9-17, Evening hours, Weekends"
          />
        </div>

        {/* Content Preferences */}
        <div>
          <Label htmlFor="content_preferences" className="text-sm font-medium text-gray-700">
            Content Preferences
          </Label>
          <Input
            id="content_preferences"
            type="text"
            value={data?.content_preferences || ''}
            onChange={(e) => handleChange('content_preferences', e.target.value)}
            placeholder="e.g., Visual content, Video ads, Interactive elements"
          />
        </div>
      </div>

      {/* Interests */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Target Interests
        </Label>

        {/* Add Interest Input */}
        <div className="flex gap-2 mb-3">
          <Input
            type="text"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add an interest (e.g., technology, travel, fitness)"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addInterest}
            disabled={!newInterest.trim()}
          >
            Add
          </Button>
        </div>

        {/* Interests List */}
        {(data?.interests || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(data?.interests || []).map((interest, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {interest}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeInterest(index)}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
        
        <p className="mt-2 text-xs text-gray-500">
          Add interests that align with your target audience
        </p>
      </div>

      {/* Behavioral Patterns */}
      <div>
        <Label htmlFor="behavioral_patterns" className="text-sm font-medium text-gray-700">
          Behavioral Patterns
        </Label>
        <Textarea
          id="behavioral_patterns"
          value={data?.behavioral_patterns || ''}
          onChange={(e) => handleChange('behavioral_patterns', e.target.value)}
          placeholder="Describe the behavioral patterns of your target audience (e.g., online shopping habits, social media usage, content consumption patterns)"
          rows={3}
        />
      </div>

      {/* Competitive Analysis */}
      <div>
        <Label htmlFor="competitive_analysis" className="text-sm font-medium text-gray-700">
          Competitive Analysis
        </Label>
        <Textarea
          id="competitive_analysis"
          value={data?.competitive_analysis || ''}
          onChange={(e) => handleChange('competitive_analysis', e.target.value)}
          placeholder="Provide insights about competitors, their strategies, and how this campaign should differentiate"
          rows={4}
        />
      </div>

      {/* Performance Predictions */}
      <div>
        <Label htmlFor="performance_predictions" className="text-sm font-medium text-gray-700">
          Performance Predictions & Goals
        </Label>
        <Textarea
          id="performance_predictions"
          value={data?.performance_predictions || ''}
          onChange={(e) => handleChange('performance_predictions', e.target.value)}
          placeholder="What are your expectations for this campaign? Include metrics like CTR, conversions, brand awareness goals, etc."
          rows={4}
        />
      </div>

      {/* AI Optimization Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">AI Optimization</h4>
        <p className="text-sm text-blue-700">
          The information provided in this section will be used to optimize ad placement, timing, and targeting 
          using AI-driven algorithms. The more detailed and accurate the information, the better the campaign performance.
        </p>
      </div>
    </div>
  );
}
