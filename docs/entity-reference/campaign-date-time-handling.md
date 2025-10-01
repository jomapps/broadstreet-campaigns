# Campaign Date/Time Handling

## Overview

Campaign start and end dates are stored and synced with explicit UTC times to prevent timezone conversion issues.

## Format Specification

### Database Storage
- **Type**: String
- **Format**: `YYYY-MM-DD HH:mm:ss`
- **Examples**:
  - Start date: `2025-01-15 00:00:00`
  - End date: `2025-02-15 23:59:59`

### Time Defaults

| Field | Default Time | Description |
|-------|-------------|-------------|
| `start_date` | `00:00:00` | Midnight UTC (start of day) |
| `end_date` | `23:59:59` | 11:59 PM UTC (end of day) |

## Implementation

### 1. Campaign Creation Form (`src/components/creation/forms/CampaignCreationForm.tsx`)

The form accepts dates in `YYYY-MM-DD` format (HTML5 date input). Times are automatically appended when the data is sent to the API.

```tsx
<Input
  type="date"
  value={formData.start_date ? formData.start_date.split('T')[0] : ''}
/>
<p className="text-sm text-gray-500 mt-1">
  When the campaign will go live (time will be set to 00:00:00 UTC)
</p>
```

### 2. Campaign Creation API (`src/app/api/create/campaign/route.ts`)

Dates from the form are automatically formatted with appropriate times before storage:

```typescript
const formatDateWithTime = (dateStr: string, isEndDate: boolean = false) => {
  if (!dateStr) return undefined;
  // Check if time is already included
  if (dateStr.includes(' ') || dateStr.includes('T')) {
    return dateStr;
  }
  // Add appropriate time: 00:00:00 for start, 23:59:59 for end
  const time = isEndDate ? '23:59:59' : '00:00:00';
  return `${dateStr} ${time}`;
};

const formattedStartDate = formatDateWithTime(startDate, false);
const formattedEndDate = endDate ? formatDateWithTime(endDate, true) : undefined;
```

### 3. Sync Service (`src/lib/sync-service.ts`)

When syncing campaigns to Broadstreet, dates are normalized to ensure they have the correct time component:

```typescript
const normalizeDateWithTime = (d?: string, isEndDate: boolean = false) => {
  if (!d) return undefined;
  try {
    // Extract date part (handles YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss formats)
    const datePart = d.split('T')[0].split(' ')[0];
    
    // Check if time is already included
    if (d.includes(' ') && d.match(/\d{2}:\d{2}:\d{2}/)) {
      // Time already present, use as-is
      return d.split('T')[0]; // Remove T if present, keep space format
    }
    
    // Add appropriate time: 00:00:00 for start, 23:59:59 for end
    const time = isEndDate ? '23:59:59' : '00:00:00';
    return `${datePart} ${time}`;
  } catch {
    return undefined;
  }
};

const startDate = normalizeDateWithTime(localCampaign.start_date, false);
if (startDate) payload.start_date = startDate;

const endDate = normalizeDateWithTime(localCampaign.end_date, true);
if (endDate) payload.end_date = endDate;
```

## Broadstreet API

The Broadstreet API accepts the following date/time formats:

### Accepted Formats
1. **Date only**: `YYYY-MM-DD` (time defaults to API's timezone, causing conversion issues)
2. **With time**: `YYYY-MM-DD HH:mm:ss` ✅ **Recommended**
3. **ISO 8601**: `YYYY-MM-DDTHH:mm:ssZ` (may cause timezone shifts)

### Recommended Format
**Always use `YYYY-MM-DD HH:mm:ss` format** with explicit UTC times:
- ✅ `2025-01-15 00:00:00` - Start at midnight UTC
- ✅ `2025-02-15 23:59:59` - End at 11:59 PM UTC

### Timezone Behavior

The API response returns dates in `YYYY-MM-DD` format (without time), but internally stores the time component. When dates are sent without explicit times:

- The API may interpret them in **server timezone** or **user's timezone**
- This can cause dates to shift by ±1 day when converted to UTC
- **Solution**: Always send explicit UTC times in `YYYY-MM-DD HH:mm:ss` format

## Testing

A test script is available to verify correct time handling:

```bash
node test-campaign-time-fix.mjs
```

This creates a test campaign and verifies the times are correctly set to 00:00:00 and 23:59:59 UTC.

## Validation

When checking campaigns in the Broadstreet backend:

1. Campaign times should display as:
   - Start: `00:00:00` (midnight UTC)
   - End: `23:59:59` (11:59 PM UTC)

2. If viewing in a local timezone (e.g., CET/CEST), the **date** displayed might shift:
   - UTC `2025-01-15 00:00:00` = CET `2025-01-15 01:00:00`
   - UTC `2025-01-14 23:00:00` = CET `2025-01-15 00:00:00`

3. Always verify against the **UTC time** shown in the backend to confirm correctness.

## Related Files

- `src/lib/sync-service.ts` - Date normalization for API sync
- `src/app/api/create/campaign/route.ts` - Date formatting on creation
- `src/components/creation/forms/CampaignCreationForm.tsx` - UI for date input
- `src/lib/models/campaign.ts` - Campaign schema
- `src/lib/models/local-campaign.ts` - Local campaign schema

