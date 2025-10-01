# Advertising Request Feature - Complete Implementation Plan

## Overview
The advertising team puts in requests to do advertising campaigns. These requests need to be created on a page, listed and then processed with the logged in users name and audit log on who requested and who processed.
A separate collection will be used for this process.

## Technical Requirements

### Authentication & Authorization
- **Authentication**: Uses existing Clerk authentication system
- **Authorization**: All authenticated users can create, view, edit, and process requests
- **User Tracking**: Automatic user assignment based on Clerk session
- **Future**: Role-based permissions planned for later implementation

### File Upload & Storage
- **Storage**: Cloudflare R2 S3-compatible bucket
- **Max File Size**: 20MB per image
- **Supported Formats**: Standard web image formats (JPEG, PNG, GIF, WebP)
- **Image Processing**: Automatic size detection using `image-size` package
- **Public URLs**: Generated via Cloudflare R2 public bucket URL

### Email Notifications
- **SMTP Configuration**: Configured via environment variables
- **Current State**: Placeholder implementation for future role-based notifications
- **Planned**: Email notifications for request status changes

## The Pages
The page will be called "Sales" in the main Menu and will be after Local only menu Point.
it will have following sub menu leading to pages:
- Request (Create new advertising requests)
- Open List (View and manage pending requests)
- Audit Log (View completed/cancelled requests)

### Page Behavior
- **Open List**: Shows only requests with status "New" or "In Progress"
- **Audit Log**: Shows only requests with status "Completed" or "Cancelled"
- **Universal Access**: All authenticated users can view, edit, delete, and update any request
- **User Tracking**: Each request tracks creator and all users who made status changes

### Request Form
The request page will have a form to create a new request. The form will have following fields:

#### User Information
- **User** (Display only) - Shows current logged-in user from Clerk session

#### Advertiser Info Section
- **Advertiser** - Required. Auto-suggest from existing advertisers. May enter name not in list
- **Advertiser ID** - Required. Sales department provided identifier
- **Contract ID** - Required. Sales department provided contract identifier
- **Contract Start Date** - Required. Date picker, sales department provided
- **Contract End Date** - Optional. Date picker, sales department provided
- **Campaign Name** - Required. Sales department provided campaign name

#### Advertisement Info Section
- **Advertisements** - One or more required (minimum 1). Media upload with the following sub-fields:
  - **Image Upload**:
    - Max file size: 20MB
    - Supported formats: JPEG, PNG, GIF, WebP
    - Automatic size detection using `image-size` package
    - Upload to Cloudflare R2 bucket with public URL generation
  - **Image Name**: Auto-extracted from filename, editable
  - **Width/Height**: Auto-filled from image analysis
  - **Image Alt Text**: Auto-populated as `[Campaign Name] - [Image Name]`, editable
  - **Size Coding**: Radio button selection (auto-selected based on dimensions):
    - **SQ** - Square images (typically 300x250px)
    - **PT** - Portrait images (typically 300x600px)
    - **LS** - Landscape images (typically 728x90px)
  - **Preview**: Image displayed at 300px width with auto height
- **Advertisement Name** - Auto-generated format:
  `[Advertiser ID] | [Advertiser - first 10 chars] - [Contract ID] - [Start Date YY.mm.dd] - [End Date YY.mm.dd] - [Image Name - first 10 chars] - [Size Coding] [width] x [height]`
- **Target URL** - Required. Full URL with https:// protocol
  - Input shows `https://` prefix
  - Automatically removes duplicate https:// if user types it
  - Validates URL format
- **HTML Code** - Optional. Textarea for tracking pixels and custom HTML
- **Ad Areas Sold** - Required. Comma-separated list, minimum 1 entry
- **Theme** - Optional. Comma-separated list, free-form text

#### AI Intelligence Section
- **Keywords** - Optional. Comma-separated list for targeting
- **Info URL** - Optional. Full URL with https:// protocol (same validation as Target URL)
- **Extra Info** - Optional. Textarea for additional sales team information

## The Workflow

### Status Lifecycle
Each request progresses through defined stages:

1. **New** - Initial state when request is created
2. **In Progress** - When someone starts working on the request
3. **Completed** - When request is fulfilled and linked to actual campaign
4. **Cancelled** - When request is cancelled/rejected

### User Tracking
- **Creator**: Automatically set from Clerk session when request is created
- **Status Changes**: Each status change records the user who made the change
- **Timestamps**: All status changes are timestamped
- **Audit Trail**: Complete history of who did what and when

### Completion Requirements
To mark a request as "Completed":
- User must select an existing **Campaign** from the system
- User must select existing **Advertisements** that fulfill the request
- This serves as proof that the request has been implemented
- Only synced entities (not local-only) can be selected for completion

### Page Routing
- **Open List**: Shows requests with status "New" or "In Progress"
- **Audit Log**: Shows requests with status "Completed" or "Cancelled"
- **Status Changes**: Automatically move requests between pages

### Email Notifications (Planned)
- **Current**: Placeholder implementation
- **Future**: Email notifications for status changes when role system is implemented
- **SMTP**: Pre-configured with environment variables

## Database Schema

### AdvertisingRequest Collection

```typescript
interface IAdvertisingRequest extends Document {
  // MongoDB identifiers
  _id: ObjectId;
  mongo_id: string; // Virtual field: _id.toString()

  // User tracking
  created_by_user_id: string; // Clerk user ID
  created_by_user_name: string; // Clerk user display name
  created_by_user_email: string; // Clerk user email

  // Status and workflow
  status: 'new' | 'in_progress' | 'completed' | 'cancelled';
  status_history: Array<{
    status: string;
    changed_by_user_id: string;
    changed_by_user_name: string;
    changed_by_user_email: string;
    changed_at: Date;
    notes?: string;
  }>;

  // Advertiser Information
  advertiser_name: string; // Required
  advertiser_id: string; // Required - Sales dept ID
  contract_id: string; // Required
  contract_start_date: Date; // Required
  contract_end_date?: Date; // Optional
  campaign_name: string; // Required

  // Advertisement Information
  advertisements: Array<{
    // File information
    image_url: string; // Cloudflare R2 public URL
    image_name: string; // Original/edited filename
    image_alt_text: string; // Auto-generated, editable

    // Image properties
    width: number; // Auto-detected
    height: number; // Auto-detected
    file_size: number; // In bytes
    mime_type: string; // e.g., 'image/jpeg'

    // Size coding
    size_coding: 'SQ' | 'PT' | 'LS'; // Auto-selected, editable

    // Advertisement details
    advertisement_name: string; // Auto-generated
    target_url: string; // Required, validated URL
    html_code?: string; // Optional tracking code

    // Upload metadata
    uploaded_at: Date;
    r2_key: string; // Internal R2 object key
  }>;

  // Marketing information
  ad_areas_sold: string[]; // Required, min 1
  themes?: string[]; // Optional

  // AI Intelligence
  keywords?: string[]; // Optional
  info_url?: string; // Optional, validated URL
  extra_info?: string; // Optional

  // Completion tracking
  completed_campaign_id?: number; // Broadstreet campaign ID when completed
  completed_advertisement_ids?: number[]; // Broadstreet ad IDs when completed
  completed_by_user_id?: string; // Clerk user ID who completed
  completed_by_user_name?: string; // Clerk user name who completed
  completed_at?: Date;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}
```

### Environment Variables Required

```bash
# Cloudflare R2 Configuration
S3_BUCKET=travelm-bucket
S3_EP=https://1aaadcc82a67cc32338f3909c938f677.eu.r2.cloudflarestorage.com/travelm-bucket
S3_ID=951975e510f67a156233f50e614217e8
S3_KEY=d2f07408ef4f45fa2e65d249008e8ba6b6d8e225224ad5ae60adc9996eb1604d
S3_REGION=us-east-1
PUBLIC_BUCKET=https://media.travelm.de/travelm-bucket/

# SMTP Configuration (for future notifications)
SMTP_HOST=mail.ft.tc
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=travelm@ft.tc
SMTP_PASS=B07J-PAGO-Xh
```


