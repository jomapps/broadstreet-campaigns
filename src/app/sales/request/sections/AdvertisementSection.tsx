'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface Advertisement {
  id: string; // Temporary ID for managing array
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
}

interface AdvertisementData {
  advertisements: Advertisement[];
  ad_areas_sold: string;
  themes: string;
}

interface AdvertisementSectionProps {
  data: AdvertisementData;
  onChange: (data: Partial<AdvertisementData>) => void;
  errors: Record<string, string>;
  advertiserInfo: {
    advertiser_name: string;
    advertiser_id: string;
    contract_id: string;
    contract_start_date: string;
    contract_end_date: string;
    campaign_name: string;
  };
}

/**
 * Advertisement Section
 * Image upload with auto-generation of names, size coding, and metadata
 */
export default function AdvertisementSection({
  data,
  onChange,
  errors,
  advertiserInfo,
}: AdvertisementSectionProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Auto-select size coding based on dimensions
  const getSizeCoding = (width: number, height: number): 'SQ' | 'PT' | 'LS' => {
    const ratio = width / height;

    // Portrait: height > width (ratio < 1)
    if (ratio < 0.9) return 'PT';

    // Landscape: width > height significantly (ratio > 1.5)
    if (ratio > 1.5) return 'LS';

    // Square: roughly equal dimensions
    return 'SQ';
  };

  // Generate advertisement name according to spec
  const generateAdvertisementName = (
    imageName: string,
    width: number,
    height: number,
    sizeCoding: 'SQ' | 'PT' | 'LS'
  ): string => {
    const { advertiser_id, advertiser_name, contract_id, contract_start_date, contract_end_date } = advertiserInfo;

    // Format dates as YY.mm.dd
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '00.00.00';
      const date = new Date(dateStr);
      const yy = date.getFullYear().toString().slice(-2);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yy}.${mm}.${dd}`;
    };

    const startDate = formatDate(contract_start_date);
    const endDate = formatDate(contract_end_date);
    const advertiserShort = advertiser_name.substring(0, 10);
    const imageShort = imageName.substring(0, 10);

    return `${advertiser_id} | ${advertiserShort} - ${contract_id} - ${startDate} - ${endDate} - ${imageShort} - ${sizeCoding} ${width} x ${height}`;
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    try {
      setUploadingIndex(data.advertisements.length);

      // Validate file size (20MB max)
      if (file.size > 20 * 1024 * 1024) {
        alert('File size must be less than 20MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        return;
      }

      // Upload to API
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/advertising-requests/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadResult = await response.json();

      // Generate metadata
      const imageName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      const sizeCoding = getSizeCoding(uploadResult.width, uploadResult.height);
      const advertisementName = generateAdvertisementName(
        imageName,
        uploadResult.width,
        uploadResult.height,
        sizeCoding
      );
      const altText = `${advertiserInfo.campaign_name} - ${imageName}`;

      // Create new advertisement object
      const newAd: Advertisement = {
        id: Date.now().toString(),
        image_url: uploadResult.url,
        image_name: imageName,
        image_alt_text: altText,
        width: uploadResult.width,
        height: uploadResult.height,
        file_size: file.size,
        mime_type: file.type,
        size_coding: sizeCoding,
        advertisement_name: advertisementName,
        target_url: 'https://',
        html_code: '',
        r2_key: uploadResult.key,
        uploaded_at: new Date(),
      };

      // Add to advertisements array
      onChange({
        advertisements: [...data.advertisements, newAd],
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingIndex(null);
    }
  };

  // Handle advertisement field update
  const handleAdUpdate = (index: number, field: keyof Advertisement, value: any) => {
    const updatedAds = [...data.advertisements];
    updatedAds[index] = { ...updatedAds[index], [field]: value };

    // If size_coding changes, regenerate advertisement_name
    if (field === 'size_coding' || field === 'image_name') {
      const ad = updatedAds[index];
      updatedAds[index].advertisement_name = generateAdvertisementName(
        ad.image_name,
        ad.width,
        ad.height,
        ad.size_coding
      );
    }

    // If image_name changes, update alt text
    if (field === 'image_name') {
      updatedAds[index].image_alt_text = `${advertiserInfo.campaign_name} - ${value}`;
    }

    onChange({ advertisements: updatedAds });
  };

  // Remove advertisement
  const handleRemoveAd = (index: number) => {
    const updatedAds = data.advertisements.filter((_, i) => i !== index);
    onChange({ advertisements: updatedAds });
  };

  // Handle target URL input - auto-clean duplicate https://
  const handleTargetUrlChange = (index: number, value: string) => {
    // Remove duplicate https:// if user types it
    const cleanValue = value.replace(/^https?:\/\/(https?:\/\/)/i, 'https://');
    handleAdUpdate(index, 'target_url', cleanValue);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Advertisement Information</h2>
        <p className="text-sm text-gray-600 mb-6">
          Upload advertisement images. Image names and metadata will be auto-generated.
        </p>
      </div>

      {/* Upload Button */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
            e.target.value = ''; // Reset input
          }}
          className="hidden"
          id="image-upload"
          disabled={uploadingIndex !== null}
        />
        <label
          htmlFor="image-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="w-12 h-12 text-gray-400 mb-2" />
          <span className="text-sm font-medium text-gray-700">
            {uploadingIndex !== null ? 'Uploading...' : 'Click to upload image'}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            Max 20MB • JPEG, PNG, GIF, WebP
          </span>
        </label>
      </div>

      {errors.advertisements && (
        <p className="text-sm text-red-600">{errors.advertisements}</p>
      )}

      {/* Advertisements List */}
      {data.advertisements.map((ad, index) => (
        <div key={ad.id} className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-md font-medium text-gray-900">Advertisement {index + 1}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveAd(index)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Image Preview */}
          <div className="flex items-center gap-4">
            <img
              src={ad.image_url}
              alt={ad.image_alt_text}
              className="w-[300px] h-auto border border-gray-200 rounded"
            />
            <div className="text-sm text-gray-600">
              <p><strong>Dimensions:</strong> {ad.width} x {ad.height}px</p>
              <p><strong>Size:</strong> {(ad.file_size / 1024).toFixed(2)} KB</p>
              <p><strong>Type:</strong> {ad.mime_type}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Name */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Image Name *
              </Label>
              <Input
                value={ad.image_name}
                onChange={(e) => handleAdUpdate(index, 'image_name', e.target.value)}
              />
            </div>

            {/* Size Coding */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Size Coding *
              </Label>
              <div className="flex gap-4 mt-2">
                {(['SQ', 'PT', 'LS'] as const).map((code) => (
                  <label key={code} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`size-coding-${index}`}
                      value={code}
                      checked={ad.size_coding === code}
                      onChange={(e) => handleAdUpdate(index, 'size_coding', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{code} - {code === 'SQ' ? 'Square' : code === 'PT' ? 'Portrait' : 'Landscape'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Advertisement Name (read-only, auto-generated) */}
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">
                Advertisement Name (auto-generated)
              </Label>
              <Input
                value={ad.advertisement_name}
                readOnly
                className="bg-gray-50"
              />
            </div>

            {/* Image Alt Text */}
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">
                Image Alt Text *
              </Label>
              <Input
                value={ad.image_alt_text}
                onChange={(e) => handleAdUpdate(index, 'image_alt_text', e.target.value)}
              />
            </div>

            {/* Target URL */}
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">
                Target URL *
              </Label>
              <Input
                value={ad.target_url}
                onChange={(e) => handleTargetUrlChange(index, e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            {/* HTML Code */}
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">
                HTML Code (Optional)
              </Label>
              <Textarea
                value={ad.html_code || ''}
                onChange={(e) => handleAdUpdate(index, 'html_code', e.target.value)}
                placeholder="Paste tracking pixels or custom HTML here"
                rows={3}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Ad Areas Sold */}
      <div>
        <Label className="text-sm font-medium text-gray-700">
          Ad Areas Sold * (comma-separated)
        </Label>
        <Input
          value={data.ad_areas_sold}
          onChange={(e) => onChange({ ad_areas_sold: e.target.value })}
          placeholder="e.g., Homepage Banner, Sidebar, Footer"
          className={errors.ad_areas_sold ? 'border-red-500' : ''}
        />
        {errors.ad_areas_sold && (
          <p className="mt-1 text-sm text-red-600">{errors.ad_areas_sold}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Enter at least one ad area, separated by commas
        </p>
      </div>

      {/* Themes */}
      <div>
        <Label className="text-sm font-medium text-gray-700">
          Themes (Optional, comma-separated)
        </Label>
        <Input
          value={data.themes}
          onChange={(e) => onChange({ themes: e.target.value })}
          placeholder="e.g., Travel, Tourism, Adventure"
        />
        <p className="mt-1 text-xs text-gray-500">
          Optional themes for categorization
        </p>
      </div>
    </div>
  );
}