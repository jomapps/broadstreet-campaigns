/**
 * Email Service for Advertising Requests
 * Handles email notifications for status changes and workflow events
 * 
 * Note: This is a placeholder implementation for future role-based notifications
 */

import nodemailer from 'nodemailer';
import type { IAdvertisingRequest } from '@/lib/models/advertising-request';

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  user: process.env.SMTP_USER!,
  pass: process.env.SMTP_PASS!,
};

// Validate required environment variables
function validateEmailConfig() {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required email environment variables: ${missing.join(', ')}`);
  }
}

// Initialize transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    validateEmailConfig();

    transporter = nodemailer.createTransporter({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      auth: {
        user: EMAIL_CONFIG.user,
        pass: EMAIL_CONFIG.pass,
      },
    });
  }

  return transporter;
}

/**
 * Email template types
 */
export type EmailTemplate = 
  | 'request_created'
  | 'request_assigned'
  | 'status_changed'
  | 'request_completed'
  | 'request_cancelled';

/**
 * Email notification result
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Base email data interface
 */
interface BaseEmailData {
  request: IAdvertisingRequest;
  recipient: string;
  recipientName?: string;
}

/**
 * Status change email data
 */
interface StatusChangeEmailData extends BaseEmailData {
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  notes?: string;
}

/**
 * Assignment email data
 */
interface AssignmentEmailData extends BaseEmailData {
  assignedBy: string;
  assignedTo: string;
}

/**
 * Generate email subject based on template and data
 */
function generateSubject(template: EmailTemplate, data: BaseEmailData): string {
  const requestNumber = data.request.request_number;
  const companyName = data.request.advertiser_info.company_name;
  
  switch (template) {
    case 'request_created':
      return `New Advertising Request: ${requestNumber} - ${companyName}`;
    case 'request_assigned':
      return `Advertising Request Assigned: ${requestNumber} - ${companyName}`;
    case 'status_changed':
      return `Status Update: ${requestNumber} - ${companyName}`;
    case 'request_completed':
      return `Request Completed: ${requestNumber} - ${companyName}`;
    case 'request_cancelled':
      return `Request Cancelled: ${requestNumber} - ${companyName}`;
    default:
      return `Advertising Request Update: ${requestNumber}`;
  }
}

/**
 * Generate email HTML content based on template and data
 */
function generateEmailContent(template: EmailTemplate, data: any): string {
  const { request } = data;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const requestUrl = `${baseUrl}/sales/audit-log?request=${request.request_number}`;
  
  const commonFooter = `
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
    <p style="color: #666; font-size: 12px;">
      View this request: <a href="${requestUrl}">${request.request_number}</a><br>
      This is an automated notification from the Broadstreet Campaigns system.
    </p>
  `;
  
  switch (template) {
    case 'request_created':
      return `
        <h2>New Advertising Request Created</h2>
        <p><strong>Request Number:</strong> ${request.request_number}</p>
        <p><strong>Company:</strong> ${request.advertiser_info.company_name}</p>
        <p><strong>Contact:</strong> ${request.advertiser_info.contact_person} (${request.advertiser_info.email})</p>
        <p><strong>Advertisement:</strong> ${request.advertisement.name}</p>
        <p><strong>Created By:</strong> ${request.created_by}</p>
        <p><strong>Status:</strong> ${request.status}</p>
        ${commonFooter}
      `;
      
    case 'request_assigned':
      const assignmentData = data as AssignmentEmailData;
      return `
        <h2>Advertising Request Assigned</h2>
        <p><strong>Request Number:</strong> ${request.request_number}</p>
        <p><strong>Company:</strong> ${request.advertiser_info.company_name}</p>
        <p><strong>Assigned To:</strong> ${assignmentData.assignedTo}</p>
        <p><strong>Assigned By:</strong> ${assignmentData.assignedBy}</p>
        <p><strong>Advertisement:</strong> ${request.advertisement.name}</p>
        ${commonFooter}
      `;
      
    case 'status_changed':
      const statusData = data as StatusChangeEmailData;
      return `
        <h2>Request Status Updated</h2>
        <p><strong>Request Number:</strong> ${request.request_number}</p>
        <p><strong>Company:</strong> ${request.advertiser_info.company_name}</p>
        <p><strong>Status Changed:</strong> ${statusData.oldStatus} → ${statusData.newStatus}</p>
        <p><strong>Changed By:</strong> ${statusData.changedBy}</p>
        ${statusData.notes ? `<p><strong>Notes:</strong> ${statusData.notes}</p>` : ''}
        ${commonFooter}
      `;
      
    case 'request_completed':
      return `
        <h2>Advertising Request Completed</h2>
        <p><strong>Request Number:</strong> ${request.request_number}</p>
        <p><strong>Company:</strong> ${request.advertiser_info.company_name}</p>
        <p><strong>Advertisement:</strong> ${request.advertisement.name}</p>
        <p><strong>Completed By:</strong> ${request.completion_data?.completed_by}</p>
        ${request.completion_data?.completion_notes ? 
          `<p><strong>Completion Notes:</strong> ${request.completion_data.completion_notes}</p>` : ''}
        ${commonFooter}
      `;
      
    case 'request_cancelled':
      return `
        <h2>Advertising Request Cancelled</h2>
        <p><strong>Request Number:</strong> ${request.request_number}</p>
        <p><strong>Company:</strong> ${request.advertiser_info.company_name}</p>
        <p><strong>Advertisement:</strong> ${request.advertisement.name}</p>
        <p>This request has been cancelled and will not be processed further.</p>
        ${commonFooter}
      `;
      
    default:
      return `
        <h2>Advertising Request Update</h2>
        <p><strong>Request Number:</strong> ${request.request_number}</p>
        <p><strong>Company:</strong> ${request.advertiser_info.company_name}</p>
        <p>An update has been made to this advertising request.</p>
        ${commonFooter}
      `;
  }
}

/**
 * Send email notification
 */
export async function sendEmailNotification(
  template: EmailTemplate,
  data: BaseEmailData | StatusChangeEmailData | AssignmentEmailData
): Promise<EmailResult> {
  try {
    const subject = generateSubject(template, data);
    const htmlContent = generateEmailContent(template, data);

    console.log('📧 Sending email notification:', {
      template,
      to: data.recipient,
      subject,
      requestNumber: data.request.request_number,
    });

    const transporter = getTransporter();

    const mailOptions = {
      from: `"Broadstreet Campaigns" <${EMAIL_CONFIG.user}>`,
      to: data.recipient,
      subject,
      html: htmlContent,
      text: htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
    
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
    };
  }
}

/**
 * Send notification for new request creation
 */
export async function notifyRequestCreated(
  request: IAdvertisingRequest,
  recipients: string[]
): Promise<EmailResult[]> {
  const results: EmailResult[] = [];
  
  for (const recipient of recipients) {
    const result = await sendEmailNotification('request_created', {
      request,
      recipient,
    });
    results.push(result);
  }
  
  return results;
}

/**
 * Send notification for status changes
 */
export async function notifyStatusChange(
  request: IAdvertisingRequest,
  oldStatus: string,
  newStatus: string,
  changedBy: string,
  recipients: string[],
  notes?: string
): Promise<EmailResult[]> {
  const results: EmailResult[] = [];
  
  for (const recipient of recipients) {
    const result = await sendEmailNotification('status_changed', {
      request,
      recipient,
      oldStatus,
      newStatus,
      changedBy,
      notes,
    });
    results.push(result);
  }
  
  return results;
}

/**
 * Send notification for request assignment
 */
export async function notifyRequestAssigned(
  request: IAdvertisingRequest,
  assignedTo: string,
  assignedBy: string,
  recipients: string[]
): Promise<EmailResult[]> {
  const results: EmailResult[] = [];
  
  for (const recipient of recipients) {
    const result = await sendEmailNotification('request_assigned', {
      request,
      recipient,
      assignedTo,
      assignedBy,
    });
    results.push(result);
  }
  
  return results;
}

/**
 * Test email configuration
 */
export async function testEmailConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email connection test failed:', error);
    return false;
  }
}

/**
 * Get default notification recipients (placeholder for role-based system)
 */
export function getNotificationRecipients(eventType: EmailTemplate): string[] {
  // Placeholder - in the future, this will query user roles and preferences
  const defaultRecipients: string[] = [
    // 'sales@company.com',
    // 'admin@company.com',
  ];

  console.log(`📧 Would notify recipients for ${eventType}:`, defaultRecipients);
  return defaultRecipients;
}
