'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface Advertisement {
  name: string;
  description?: string;
  target_url: string;
  target_audience?: string;
  campaign_goals?: string;
  budget_range?: string;
  preferred_zones?: string[];
  image_files: Array<{
    name: string;
    size: number;
    type: string;
    url?: string;
    dimensions?: { width: number; height: number };
    size_coding?: string;
  }>;
}

interface AdvertisementSectionProps {
  data?: Advertisement;
  onChange: (data: Partial<Advertisement>) => void;
  errors: Record<string, string>;
}

/**
 * Advertisement Section
 * Collects advertisement details and handles file uploads
 */
export default function AdvertisementSection({
  data = {
    name: '',
    description: '',
    target_url: '',
    target_audience: '',
    campaign_goals: '',
    budget_range: '',
    preferred_zones: [],
    image_files: [],
  },
  onChange,
  errors,
}: AdvertisementSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  const handleChange = (field: string, value: string | string[]) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleZoneInput = (value: string) => {
    // Convert comma-separated string to array
    const zones = value.split(',').map(zone => zone.trim()).filter(zone => zone.length > 0);
    handleChange('preferred_zones', zones);
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;

    setUploading(true);
    setUploadError('');

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file
        if (file.size > 20 * 1024 * 1024) { // 20MB limit
          throw new Error(`File ${file.name} is too large (max 20MB)`);
        }

        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image`);
        }

        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // Upload file
        const response = await fetch('/api/advertising-requests/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to upload ${file.name}`);
        }

        const result = await response.json();
        return {
          name: file.name,
          size: file.size,
          type: file.type,
          url: result.url,
          dimensions: result.dimensions,
          size_coding: result.size_coding,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Add uploaded files to the current list
      onChange({
        ...data,
        image_files: [...(data?.image_files || []), ...uploadedFiles],
      });

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = (data?.image_files || []).filter((_, i) => i !== index);
    onChange({
      ...data,
      image_files: newFiles,
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Advertisement Details</h2>
        <p className="text-sm text-gray-600 mb-6">
          Provide details about the advertisement and upload any creative assets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Advertisement Name */}
        <div className="md:col-span-2">
          <Label htmlFor="ad_name" className="text-sm font-medium text-gray-700">
            Advertisement Name *
          </Label>
          <Input
            id="ad_name"
            type="text"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={errors.ad_name ? 'border-red-500' : ''}
            placeholder="Enter advertisement name"
          />
          {errors.ad_name && (
            <p className="mt-1 text-sm text-red-600">{errors.ad_name}</p>
          )}
        </div>

        {/* Target URL */}
        <div>
          <Label htmlFor="target_url" className="text-sm font-medium text-gray-700">
            Target URL *
          </Label>
          <Input
            id="target_url"
            type="url"
            value={data?.target_url || ''}
            onChange={(e) => handleChange('target_url', e.target.value)}
            className={errors.target_url ? 'border-red-500' : ''}
            placeholder="https://example.com/landing-page"
          />
          {errors.target_url && (
            <p className="mt-1 text-sm text-red-600">{errors.target_url}</p>
          )}
        </div>

        {/* Target Audience */}
        <div>
          <Label htmlFor="target_audience" className="text-sm font-medium text-gray-700">
            Target Audience
          </Label>
          <Input
            id="target_audience"
            type="text"
            value={data?.target_audience || ''}
            onChange={(e) => handleChange('target_audience', e.target.value)}
            placeholder="e.g., Adults 25-45, Tech enthusiasts"
          />
        </div>

        {/* Budget Range */}
        <div>
          <Label htmlFor="budget_range" className="text-sm font-medium text-gray-700">
            Budget Range
          </Label>
          <Input
            id="budget_range"
            type="text"
            value={data?.budget_range || ''}
            onChange={(e) => handleChange('budget_range', e.target.value)}
            placeholder="e.g., $1000-$5000"
          />
        </div>

        {/* Preferred Zones */}
        <div className="md:col-span-2">
          <Label htmlFor="preferred_zones" className="text-sm font-medium text-gray-700">
            Preferred Zones
          </Label>
          <Input
            id="preferred_zones"
            type="text"
            value={(data?.preferred_zones || []).join(', ')}
            onChange={(e) => handleZoneInput(e.target.value)}
            placeholder="Enter zone names separated by commas"
          />
          {(data?.preferred_zones || []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {(data?.preferred_zones || []).map((zone, index) => (
                <Badge key={index} variant="secondary">
                  {zone}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="ad_description" className="text-sm font-medium text-gray-700">
          Advertisement Description *
        </Label>
        <Textarea
          id="ad_description"
          value={data?.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          className={errors.ad_description ? 'border-red-500' : ''}
          placeholder="Describe the advertisement, its purpose, and key messaging"
          rows={4}
        />
        {errors.ad_description && (
          <p className="mt-1 text-sm text-red-600">{errors.ad_description}</p>
        )}
      </div>

      {/* Campaign Goals */}
      <div>
        <Label htmlFor="campaign_goals" className="text-sm font-medium text-gray-700">
          Campaign Goals
        </Label>
        <Textarea
          id="campaign_goals"
          value={data?.campaign_goals || ''}
          onChange={(e) => handleChange('campaign_goals', e.target.value)}
          placeholder="What are the main objectives of this campaign?"
          rows={3}
        />
      </div>

      {/* File Upload Section */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Creative Assets
        </Label>
        
        {/* Upload Button */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
          />
          
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Upload image files (JPG, PNG, GIF, WebP)
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Maximum file size: 20MB per file
          </p>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mb-2"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Choose Files'}
          </Button>
          
          {uploadError && (
            <p className="text-sm text-red-600 mt-2">{uploadError}</p>
          )}
        </div>

        {/* Uploaded Files List */}
        {(data?.image_files || []).length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
            {(data?.image_files || []).map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                      {file.dimensions && ` • ${file.dimensions.width}×${file.dimensions.height}`}
                      {file.size_coding && ` • ${file.size_coding}`}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
