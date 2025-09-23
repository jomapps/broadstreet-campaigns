/**
 * Image processing utilities for advertising requests
 * Handles image size detection and automatic coding (SQ/PT/LS)
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageInfo extends ImageDimensions {
  size_coding: 'SQ' | 'PT' | 'LS';
  aspect_ratio: number;
}

/**
 * Determines the size coding based on image dimensions
 * SQ = Square (1:1 ratio or close to it)
 * PT = Portrait (taller than wide)
 * LS = Landscape (wider than tall)
 */
export function determineSizeCoding(width: number, height: number): 'SQ' | 'PT' | 'LS' {
  const aspectRatio = width / height;
  
  // Square: aspect ratio between 0.9 and 1.1 (allowing for slight variations)
  if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
    return 'SQ';
  }
  
  // Portrait: height > width (aspect ratio < 1)
  if (aspectRatio < 1) {
    return 'PT';
  }
  
  // Landscape: width > height (aspect ratio > 1)
  return 'LS';
}

/**
 * Analyzes image dimensions and returns comprehensive info
 */
export function analyzeImageDimensions(width: number, height: number): ImageInfo {
  const aspect_ratio = width / height;
  const size_coding = determineSizeCoding(width, height);
  
  return {
    width,
    height,
    aspect_ratio,
    size_coding,
  };
}

/**
 * Validates image file constraints
 */
export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateImageFile(
  file: File,
  maxSizeBytes: number = 20 * 1024 * 1024 // 20MB default
): ImageValidationResult {
  const errors: string[] = [];
  
  // Check file size
  if (file.size > maxSizeBytes) {
    const maxSizeMB = maxSizeBytes / (1024 * 1024);
    errors.push(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed size of ${maxSizeMB}MB`);
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates a safe filename for storage
 */
export function generateSafeFilename(originalName: string, requestNumber: string): string {
  // Extract file extension
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  
  // Create safe base name (remove special characters, spaces, etc.)
  const baseName = originalName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace special chars with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .substring(0, 50); // Limit length
  
  // Generate timestamp for uniqueness
  const timestamp = Date.now();
  
  return `${requestNumber}_${baseName}_${timestamp}.${extension}`;
}

/**
 * Extracts image dimensions from a File object using browser APIs
 * Note: This is a client-side utility. For server-side, use the image-size package.
 */
export function getImageDimensionsFromFile(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      
      // Clean up
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Server-side image dimension detection using image-size package
 * This will be used in API routes
 */
export function getImageDimensionsFromBuffer(buffer: Buffer): ImageDimensions {
  try {
    const sizeOf = require('image-size');
    const dimensions = sizeOf(buffer);

    if (!dimensions.width || !dimensions.height) {
      throw new Error('Could not determine image dimensions');
    }

    return {
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    throw new Error(`Failed to get image dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Comprehensive image processing for uploaded files
 */
export interface ProcessedImageInfo {
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  width: number;
  height: number;
  size_coding: 'SQ' | 'PT' | 'LS';
  aspect_ratio: number;
}

export async function processUploadedImage(
  file: File,
  requestNumber: string
): Promise<ProcessedImageInfo> {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(`Image validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Get dimensions
  const dimensions = await getImageDimensionsFromFile(file);
  const imageInfo = analyzeImageDimensions(dimensions.width, dimensions.height);
  
  // Generate safe filename
  const filename = generateSafeFilename(file.name, requestNumber);
  
  return {
    filename,
    original_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    width: imageInfo.width,
    height: imageInfo.height,
    size_coding: imageInfo.size_coding,
    aspect_ratio: imageInfo.aspect_ratio,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get size coding description for UI display
 */
export function getSizeCodingDescription(coding: 'SQ' | 'PT' | 'LS'): string {
  switch (coding) {
    case 'SQ':
      return 'Square';
    case 'PT':
      return 'Portrait';
    case 'LS':
      return 'Landscape';
    default:
      return 'Unknown';
  }
}
