/**
 * Business Logic Helpers for Advertising Requests
 * Contains utility functions for advertisement naming, validation, and workflow management
 */

import type { IAdvertisingRequest } from '@/lib/models/advertising-request';

/**
 * Generate advertisement name based on the complex formula from requirements
 * Format: [Company Name] - [Size Coding] - [Target Audience/Campaign Goals] - [Unique Identifier]
 */
export function generateAdvertisementName(
  companyName: string,
  sizeCoding: string,
  targetAudience?: string,
  campaignGoals?: string,
  uniqueId?: string
): string {
  // Clean company name (remove special characters, limit length)
  const cleanCompanyName = companyName
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .substring(0, 30);
  
  // Determine the audience/goals part
  let audienceGoals = '';
  if (targetAudience && targetAudience.trim()) {
    audienceGoals = targetAudience.trim().substring(0, 20);
  } else if (campaignGoals && campaignGoals.trim()) {
    audienceGoals = campaignGoals.trim().substring(0, 20);
  } else {
    audienceGoals = 'General';
  }
  
  // Clean audience/goals (remove special characters)
  audienceGoals = audienceGoals
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim();
  
  // Generate unique identifier if not provided
  const identifier = uniqueId || Date.now().toString().slice(-6);
  
  // Combine all parts
  const parts = [cleanCompanyName, sizeCoding, audienceGoals, identifier];
  return parts.join(' - ');
}

/**
 * Validate URL format and ensure https:// prefix
 */
export function validateAndFormatUrl(url: string): { isValid: boolean; formattedUrl?: string; error?: string } {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'URL is required' };
  }
  
  let formattedUrl = url.trim();
  
  // Add https:// if no protocol is specified
  if (!formattedUrl.match(/^https?:\/\//i)) {
    formattedUrl = `https://${formattedUrl}`;
  }
  
  // Validate URL format
  try {
    const urlObj = new URL(formattedUrl);
    
    // Ensure it's http or https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    
    return { isValid: true, formattedUrl };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate phone number (basic validation)
 */
export function validatePhone(phone: string): boolean {
  if (!phone || !phone.trim()) return true; // Phone is optional
  
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Should have at least 10 digits
  return digitsOnly.length >= 10;
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  } else if (digitsOnly.length === 11 && digitsOnly[0] === '1') {
    return `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
  }
  
  return phone; // Return original if can't format
}

/**
 * Validate advertising request data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateAdvertisingRequestData(data: Partial<IAdvertisingRequest>): ValidationResult {
  const errors: string[] = [];
  
  // Validate advertiser info
  if (!data.advertiser_info?.company_name?.trim()) {
    errors.push('Company name is required');
  }
  
  if (!data.advertiser_info?.contact_person?.trim()) {
    errors.push('Contact person is required');
  }
  
  if (!data.advertiser_info?.email?.trim()) {
    errors.push('Email is required');
  } else if (!validateEmail(data.advertiser_info.email)) {
    errors.push('Invalid email format');
  }
  
  if (data.advertiser_info?.phone && !validatePhone(data.advertiser_info.phone)) {
    errors.push('Invalid phone number format');
  }
  
  if (data.advertiser_info?.website) {
    const urlValidation = validateAndFormatUrl(data.advertiser_info.website);
    if (!urlValidation.isValid) {
      errors.push(`Invalid website URL: ${urlValidation.error}`);
    }
  }
  
  // Validate advertisement info
  if (!data.advertisement?.name?.trim()) {
    errors.push('Advertisement name is required');
  }
  
  if (!data.advertisement?.target_url?.trim()) {
    errors.push('Target URL is required');
  } else {
    const urlValidation = validateAndFormatUrl(data.advertisement.target_url);
    if (!urlValidation.isValid) {
      errors.push(`Invalid target URL: ${urlValidation.error}`);
    }
  }
  
  // Validate image files
  if (!data.advertisement?.image_files || data.advertisement.image_files.length === 0) {
    errors.push('At least one image file is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: IAdvertisingRequest['status'],
  newStatus: IAdvertisingRequest['status']
): boolean {
  const validTransitions: Record<IAdvertisingRequest['status'], IAdvertisingRequest['status'][]> = {
    'New': ['In Progress', 'Cancelled'],
    'In Progress': ['Completed', 'Cancelled'],
    'Completed': [], // Completed requests cannot be changed
    'Cancelled': [], // Cancelled requests cannot be changed
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

/**
 * Get next possible statuses for a request
 */
export function getNextPossibleStatuses(currentStatus: IAdvertisingRequest['status']): IAdvertisingRequest['status'][] {
  const transitions: Record<IAdvertisingRequest['status'], IAdvertisingRequest['status'][]> = {
    'New': ['In Progress', 'Cancelled'],
    'In Progress': ['Completed', 'Cancelled'],
    'Completed': [],
    'Cancelled': [],
  };
  
  return transitions[currentStatus] || [];
}

/**
 * Generate status badge color for UI
 */
export function getStatusBadgeColor(status: IAdvertisingRequest['status']): string {
  switch (status) {
    case 'New':
      return 'blue';
    case 'In Progress':
      return 'yellow';
    case 'Completed':
      return 'green';
    case 'Cancelled':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Calculate request priority based on various factors
 */
export function calculateRequestPriority(request: IAdvertisingRequest): 'Low' | 'Medium' | 'High' | 'Urgent' {
  let score = 0;
  
  // Age factor (older requests get higher priority)
  const ageInDays = (Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageInDays > 7) score += 3;
  else if (ageInDays > 3) score += 2;
  else if (ageInDays > 1) score += 1;
  
  // Status factor
  if (request.status === 'In Progress') score += 2;
  else if (request.status === 'New') score += 1;
  
  // Image count factor (more images = more complex)
  const imageCount = request.advertisement.image_files.length;
  if (imageCount > 5) score += 2;
  else if (imageCount > 2) score += 1;
  
  // AI intelligence completeness (more complete = higher priority)
  const aiFields = [
    request.advertisement.target_audience,
    request.advertisement.campaign_goals,
    request.advertisement.budget_range,
  ].filter(field => field && field.trim());
  
  if (aiFields.length >= 3) score += 2;
  else if (aiFields.length >= 2) score += 1;
  
  // Determine priority based on score
  if (score >= 8) return 'Urgent';
  if (score >= 6) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}

/**
 * Format request for display in lists/cards
 */
export interface FormattedRequest {
  id: string;
  requestNumber: string;
  companyName: string;
  contactPerson: string;
  email: string;
  advertisementName: string;
  status: IAdvertisingRequest['status'];
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  createdAt: Date;
  imageCount: number;
  assignedTo?: string;
}

export function formatRequestForDisplay(request: IAdvertisingRequest): FormattedRequest {
  return {
    id: request.mongo_id,
    requestNumber: request.request_number,
    companyName: request.advertiser_info.company_name,
    contactPerson: request.advertiser_info.contact_person,
    email: request.advertiser_info.email,
    advertisementName: request.advertisement.name,
    status: request.status,
    priority: calculateRequestPriority(request),
    createdAt: request.createdAt,
    imageCount: request.advertisement.image_files.length,
    assignedTo: request.assigned_to,
  };
}

/**
 * Search and filter requests
 */
export function filterRequests(
  requests: IAdvertisingRequest[],
  filters: {
    status?: IAdvertisingRequest['status'];
    assignedTo?: string;
    searchTerm?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }
): IAdvertisingRequest[] {
  return requests.filter(request => {
    // Status filter
    if (filters.status && request.status !== filters.status) {
      return false;
    }
    
    // Assigned to filter
    if (filters.assignedTo && request.assigned_to !== filters.assignedTo) {
      return false;
    }
    
    // Search term filter (searches in company name, contact person, advertisement name)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const searchableText = [
        request.advertiser_info.company_name,
        request.advertiser_info.contact_person,
        request.advertisement.name,
        request.request_number,
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchLower)) {
        return false;
      }
    }
    
    // Date range filter
    if (filters.dateFrom && request.createdAt < filters.dateFrom) {
      return false;
    }
    
    if (filters.dateTo && request.createdAt > filters.dateTo) {
      return false;
    }
    
    return true;
  });
}
