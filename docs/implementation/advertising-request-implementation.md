# Advertising Request Feature - Implementation Plan

## Overview

This document provides a comprehensive implementation plan for the Advertising Request feature, broken down into phases and tasks. The feature allows sales teams to create, manage, and track advertising campaign requests through a complete workflow.

## Implementation Phases

### Phase 1: Foundation & Database Setup
**Estimated Time**: 2-3 days

#### Task 1.1: Install Dependencies
```bash
npm install image-size @aws-sdk/client-s3 @aws-sdk/s3-request-presigner nodemailer
npm install --save-dev @types/nodemailer
```

#### Task 1.2: Create Database Model
**File**: `src/lib/models/advertising-request.ts`
- Create comprehensive AdvertisingRequest schema
- Add proper validation and indexes
- Include virtual fields for mongo_id
- Set up status history tracking

#### Task 1.3: Create Utility Functions
**Files**:
- `src/lib/utils/image-processing.ts` - Image size detection and coding
- `src/lib/utils/r2-upload.ts` - Cloudflare R2 upload utilities
- `src/lib/utils/email-service.ts` - Email notification service (placeholder)
- `src/lib/utils/advertising-request-helpers.ts` - Business logic helpers

#### Task 1.4: Update Navigation
**File**: `src/components/layout/Header.tsx`
- Add "Sales" menu item after "Local Only"
- Update middleware to protect sales routes

### Phase 2: API Endpoints
**Estimated Time**: 3-4 days

#### Task 2.1: Core CRUD APIs
**Files**:
- `src/app/api/advertising-requests/route.ts` - GET (list) and POST (create)
- `src/app/api/advertising-requests/[id]/route.ts` - GET, PUT, DELETE individual requests
- `src/app/api/advertising-requests/[id]/status/route.ts` - Status updates

#### Task 2.2: File Upload APIs
**Files**:
- `src/app/api/advertising-requests/upload/route.ts` - Image upload to R2
- `src/app/api/advertising-requests/[id]/images/route.ts` - Manage request images

#### Task 2.3: Completion APIs
**Files**:
- `src/app/api/advertising-requests/[id]/complete/route.ts` - Mark as completed
- `src/app/api/advertising-requests/campaigns/route.ts` - Get available campaigns
- `src/app/api/advertising-requests/advertisements/route.ts` - Get available ads

### Phase 3: UI Components & Forms
**Estimated Time**: 4-5 days

#### Task 3.1: Create Base Components
**Files**:
- `src/components/advertising-requests/AdvertisingRequestCard.tsx` - Universal card
- `src/components/advertising-requests/StatusBadge.tsx` - Status display
- `src/components/advertising-requests/UserBadge.tsx` - User information display

#### Task 3.2: Create Form Components
**Files**:
- `src/components/advertising-requests/forms/RequestForm.tsx` - Main form
- `src/components/advertising-requests/forms/AdvertiserInfoSection.tsx`
- `src/components/advertising-requests/forms/AdvertisementInfoSection.tsx`
- `src/components/advertising-requests/forms/AIIntelligenceSection.tsx`
- `src/components/advertising-requests/forms/ImageUploadComponent.tsx`

#### Task 3.3: Create Management Components
**Files**:
- `src/components/advertising-requests/StatusUpdateModal.tsx`
- `src/components/advertising-requests/CompletionModal.tsx`
- `src/components/advertising-requests/RequestDetailsModal.tsx`

### Phase 4: Page Implementation
**Estimated Time**: 3-4 days

#### Task 4.1: Create Sales Pages Structure
**Files**:
- `src/app/sales/layout.tsx` - Sales section layout
- `src/app/sales/page.tsx` - Redirect to request page
- `src/app/sales/request/page.tsx` - Create new request
- `src/app/sales/open-list/page.tsx` - Open requests list
- `src/app/sales/audit-log/page.tsx` - Completed/cancelled requests

#### Task 4.2: Implement Server-Side Data Fetching
**Files**:
- `src/lib/server/advertising-request-fetchers.ts` - Server data fetchers
- Follow existing patterns from other pages
- Implement proper filtering and pagination

#### Task 4.3: Create Client Components
**Files**:
- `src/app/sales/request/RequestClient.tsx`
- `src/app/sales/open-list/OpenListClient.tsx`
- `src/app/sales/audit-log/AuditLogClient.tsx`
- `src/app/sales/LoadingSkeleton.tsx`

### Phase 5: Zustand Store Integration
**Estimated Time**: 2-3 days

#### Task 5.1: Create Advertising Request Store
**File**: `src/stores/advertising-request-store.ts`
- Follow existing Zustand patterns
- Implement CRUD operations
- Add status management
- Include file upload state

#### Task 5.2: Update Store Index
**File**: `src/stores/index.ts`
- Export new store
- Add convenience hooks
- Update type definitions

#### Task 5.3: Update Variable Registry
**File**: `docs/variable-origins.md`
- Add all new variable names
- Follow established naming conventions
- Document store actions and state

### Phase 6: Integration & Testing
**Estimated Time**: 2-3 days

#### Task 6.1: Integration Testing
- Test complete workflow from creation to completion
- Verify file uploads work correctly
- Test status transitions
- Validate user tracking

#### Task 6.2: Error Handling
- Add comprehensive error handling
- Implement proper validation
- Add user-friendly error messages
- Test edge cases

#### Task 6.3: Performance Optimization
- Optimize image upload process
- Implement proper loading states
- Add pagination for large lists
- Optimize database queries

## Technical Implementation Details

### Image Processing Workflow
1. User selects image file
2. Client validates file size (max 20MB) and type
3. Upload to temporary location
4. Server processes with `image-size` package
5. Auto-detect size coding (SQ/PT/LS)
6. Upload to Cloudflare R2
7. Generate public URL
8. Store metadata in database

### Status Management
- All status changes tracked with user and timestamp
- Status history maintained for audit purposes
- Automatic page routing based on status
- Email notifications (placeholder for future)

### Completion Workflow
1. User clicks "Complete" on request
2. Modal opens with campaign/advertisement selection
3. User must select existing synced entities
4. System validates selections
5. Request marked as completed with references
6. Moves to audit log automatically

### File Structure
```
src/
├── app/
│   └── sales/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── request/
│       ├── open-list/
│       └── audit-log/
├── components/
│   └── advertising-requests/
│       ├── forms/
│       ├── modals/
│       └── cards/
├── lib/
│   ├── models/
│   │   └── advertising-request.ts
│   └── utils/
│       ├── image-processing.ts
│       ├── r2-upload.ts
│       └── email-service.ts
└── stores/
    └── advertising-request-store.ts
```

## Next Steps

1. **Review and Approve Plan**: Confirm all requirements are covered
2. **Environment Setup**: Verify R2 and SMTP credentials
3. **Begin Phase 1**: Start with database model and utilities
4. **Iterative Development**: Implement and test each phase
5. **User Testing**: Test complete workflow with real users
6. **Documentation**: Update user guides and technical docs

## Future Enhancements

- Role-based permissions and notifications
- Advanced filtering and search
- Bulk operations
- Integration with external systems
- Analytics and reporting
- Mobile-responsive improvements
