# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Broadstreet Campaigns is a dual-database Next.js application that syncs advertising entities from the Broadstreet API into local MongoDB, while supporting local-only workflows. The app manages Networks, Advertisers, Zones, Campaigns, Advertisements, and Placements with explicit sync operations (no background polling).

## Development Commands

### Core Development
```bash
# Development server (runs on port 3005)
pnpm dev

# Production build (requires memory allocation due to 48 routes + complex TS/Tailwind)
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint
```

### Database Operations
```bash
# Seed test data
pnpm db:seed

# Drop database
pnpm db:drop

# Reset database (drop + seed)
pnpm db:reset

# Backup database
pnpm db:backup

# Restore database
pnpm db:restore
```

### Testing
```bash
# Run all Playwright tests
pnpm test

# Run tests with interactive UI
pnpm test:ui

# Run tests in headed mode (visible browser)
pnpm test:headed

# Run only local page tests
pnpm test:local-page
```

### Utility Scripts
```bash
# Delete zone by name
pnpm delete:zone-by-name
```

## Architecture

### Data Flow Architecture
1. **Download Layer**: Dashboard "Sync Data" → Broadstreet API → MongoDB (synced collections)
2. **Local Layer**: Local-only operations → Local* collections (LocalAdvertiser, LocalCampaign, etc.)
3. **Upload Layer**: Local-Only "Upload to Broadstreet" → Push local entities upstream
4. **Application Layer**: Next.js App Router + PayloadCMS Local API + Zustand stores

### Key Collections
- **Synced Collections**: Networks, Advertisers, Zones, Campaigns, Advertisements, Placements (read-only except during sync)
- **Local-Only Collections**: LocalAdvertiser, LocalCampaign, LocalNetwork, LocalZone, LocalAdvertisement (separate until uploaded)
- **System Collections**: Themes, SyncLogs, AdvertisingRequests

### Technology Stack
- **Frontend**: Next.js 15.5.2 with App Router, React 19, TailwindCSS v4
- **State Management**: Zustand stores (app-store, entity-store, filter-store, sync-store)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Clerk
- **Testing**: Playwright (comprehensive E2E tests)
- **Deployment**: Vercel-optimized build

## Critical Database Rules

### Hard Rules (NEVER violate)
- Never delete synced entities during normal operations (advertisers, zones, campaigns, ads, placements)
- EXCEPTION: During "Sync Data", Broadstreet-sourced collections are cleared and refreshed
- Never delete synced placements from Placement collection
- Local-only entities must remain in separate Local* collections until uploaded

### ID Conventions
- Use only these fields: `broadstreet_id`, `mongo_id`, and MongoDB native `_id`
- Avoid generic `id` field
- Default network: "FASH Medien Verlag GmbH - SCHWULISSIMO 9396" (ID 9396)

## Sync Operations

### Two Explicit Sync Points
1. **Dashboard "Sync Data"**: Download from Broadstreet API (refreshes all Broadstreet-sourced collections)
2. **Local-Only "Upload to Broadstreet"**: Upload local-only entities to Broadstreet API

### Sync Principles
- No background polling - all changes happen on demand
- Respect API rate limiting via `REQUEST_RATE_LIMIT` env var (seconds between requests)
- Prefer drop-and-resync for major structural changes

## Build Requirements

### Memory Allocation
The build process requires additional memory due to:
- 48 routes (12 static pages + 36 API endpoints)
- Complex TypeScript compilation
- TailwindCSS v4 processing

Use this for reliable builds:
```bash
# Manual build with memory allocation
NODE_OPTIONS="--max-old-space-size=4096" npx next build
```

## Testing Strategy

### Playwright Configuration
- Base URL: `http://localhost:3005`
- Tests automatically start dev server
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile and desktop viewport testing
- Screenshots/videos on failure

### Test Coverage
- Entity creation and display
- Sync functionality and progress modals
- Delete operations and cleanup
- Responsive UI/UX testing
- Error handling

## Byterover Memory Layer Integration

When working with Byterover tools:

### Onboarding Workflow
1. Use `byterover-check-handbook-existence` first
2. Create handbook if needed with `byterover-create-handbook`
3. Update modules with `byterover-store-modules` and `byterover-update-modules`
4. Store knowledge with `byterover-store-knowledge`

### Planning Workflow
1. Retrieve knowledge with `byterover-retrieve-knowledge` for each task
2. Save plans immediately with `byterover-save-implementation-plan` when approved
3. Update progress with `byterover-update-plan-progress`
4. Store implementation knowledge with `byterover-store-knowledge`

Always use phrases like "According to Byterover memory layer" when referencing retrieved information.

## Key Directories

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components organized by feature
- `src/lib/models/` - Mongoose models for all entities
- `src/stores/` - Zustand state management stores  
- `src/lib/services/` - API integration services
- `docs/` - Comprehensive project documentation
- `tests/` - Playwright E2E tests
- `scripts/` - Database and utility scripts

## Development Notes

- Port 3005 is hardcoded throughout the codebase
- Environment variables required: `BROADSTREET_API_KEY`, `MONGODB_URI`, Clerk auth vars
- Authentication contact: leo@fashmedien.de
- Company: FASH Medien Verlag GmbH
- All UI components use shadcn/ui patterns with Radix primitives

## Documentation Structure

The `docs/` directory contains detailed technical documentation cross-linked for quick navigation. Key canonical sources:
- Entity IDs: `entity-reference/ids.md`
- Zustand patterns: `implementation/zustand-implementation.md`
- Broadstreet API specs: `entity-reference/broadstreet-api-specs.json`
- Variable origins: `variable-origins.md`