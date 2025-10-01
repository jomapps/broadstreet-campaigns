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
  if (!data.advertiser_name?.trim()) {
    errors.push('Company name is required');
  }

  if (!data.created_by_user_email?.trim()) {
    errors.push('Email is required');
  } else if (!validateEmail(data.created_by_user_email)) {
    errors.push('Invalid email format');
  }

  if (!data.campaign_name?.trim()) {
    errors.push('Campaign name is required');
  }
  
  if (data.info_url) {
    const urlValidation = validateAndFormatUrl(data.info_url);
    if (!urlValidation.isValid) {
      errors.push(`Invalid info URL: ${urlValidation.error}`);
    }
  }

  if (data.extra_info && data.extra_info.length > 1000) {
    errors.push('Extra information is too long');
  }

  if (!data.advertisements || data.advertisements.length === 0) {
    errors.push('At least one advertisement is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function isValidStatusTransition(
  currentStatus: IAdvertisingRequest['status'],
  newStatus: IAdvertisingRequest['status']
): boolean {
  const validTransitions: Record<IAdvertisingRequest['status'], IAdvertisingRequest['status'][]> = {
    new: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

export function getNextPossibleStatuses(currentStatus: IAdvertisingRequest['status']): IAdvertisingRequest['status'][] {
  const transitions: Record<IAdvertisingRequest['status'], IAdvertisingRequest['status'][]> = {
    new: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };
  
  return transitions[currentStatus] || [];
}

export function getStatusBadgeColor(status: IAdvertisingRequest['status']): string {
  switch (status) {
    case 'new':
      return 'blue';
    case 'in_progress':
      return 'yellow';
    case 'completed':
      return 'green';
    case 'cancelled':
      return 'red';
    default:
      return 'gray';
  }
}

export function getReadableStatus(status: IAdvertisingRequest['status']): string {
  switch (status) {
    case 'new':
      return 'New';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function generateStatusChangeSummary(request: IAdvertisingRequest): string {
  const statusHistory = request.status_history || [];
  if (statusHistory.length === 0) {
    return 'No status history available';
  }

  const latestStatus = statusHistory[statusHistory.length - 1];
  return `Status changed to ${getReadableStatus(latestStatus.status as IAdvertisingRequest['status'])} by ${latestStatus.changed_by_user_name} on ${latestStatus.changed_at.toLocaleString()}`;
}

/**
 * Calculate request priority based on various factors
 */
export function calculateRequestPriority(request: IAdvertisingRequest): 'Low' | 'Medium' | 'High' | 'Urgent' {
  let score = 0;
  
  // Age factor (older requests get higher priority)
  const ageInDays = (Date.now() - request.created_at.getTime()) / (1000 * 60 * 60 * 24);
  if (ageInDays > 7) score += 3;
  else if (ageInDays > 3) score += 2;
  else if (ageInDays > 1) score += 1;
  
  // Status factor
  if (request.status === 'in_progress') score += 2;
  else if (request.status === 'new') score += 1;
  
  // Image count factor (more images = more complex)
  const imageCount = request.advertisements?.reduce((count, ad) => count + (ad ? 1 : 0), 0) || 0;
  if (imageCount > 5) score += 2;
  else if (imageCount > 2) score += 1;
  
  // AI intelligence completeness (more complete = higher priority)
  const aiFields = (
    request.advertisements?.flatMap(ad => [
      ad.target_url,
      ad.advertisement_name,
    ]) || []
  ).filter(Boolean);
  if (request.keywords && request.keywords.length > 0) {
    aiFields.push(request.keywords.join(','));
  }
  if (request.info_url) aiFields.push(request.info_url);
  if (aiFields.length >= 3) score += 2;
  else if (aiFields.length >= 1) score += 1;
  
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
}

export function formatRequestForDisplay(request: IAdvertisingRequest): FormattedRequest {
  return {
    id: request.mongo_id,
    requestNumber: String(request._id).slice(-8).toUpperCase(),
    companyName: request.advertiser_name,
    contactPerson: request.created_by_user_name,
    email: request.created_by_user_email,
    advertisementName: request.advertisements?.[0]?.advertisement_name || request.campaign_name,
    status: request.status,
    priority: calculateRequestPriority(request),
    createdAt: request.created_at,
    imageCount: request.advertisements?.reduce((count, ad) => count + (ad ? 1 : 0), 0) || 0,
  };
}

/**
 * Search and filter requests
 */
export function filterRequests(
  requests: IAdvertisingRequest[],
  filters: {
    status?: IAdvertisingRequest['status'];
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
    
    // Search term filter (searches in company name, contact person, advertisement name)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const searchableText = [
        request.advertiser_name,
        request.created_by_user_name,
        request.advertisements?.[0]?.advertisement_name || request.campaign_name,
        String(request._id).slice(-8).toUpperCase(),
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchLower)) {
        return false;
      }
    }
    
    // Date range filter
    if (filters.dateFrom && request.created_at < filters.dateFrom) {
      return false;
    }
    
    if (filters.dateTo && request.created_at > filters.dateTo) {
      return false;
    }
    
    return true;
  });
}

