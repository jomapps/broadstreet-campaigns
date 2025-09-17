# Entity Card Migration

## Overview
We have different cards for different entities and different pages. We want to migrate to a single card component that can be used for all entities and pages.

## Card Design Reference
[Card Design Reference](docs/desgin-reference/card-design.md)
**CRITCAL** no fallbacks, no mockdata, no legacy compatibility.
**CRITICAL** App is working fine so it should not break.

## Migration Plan
Start with phases for each type of entity. Get approval from user for each phase, then move to the next.

### Global Constraints
- Use `src/components/ui/universal-entity-card.tsx` everywhere (no per-entity bespoke card UIs).
- Do not break the app; keep routes functional as-is.
- Follow design rules in `card-design.md` (breadcrumb, IDs, dd/mm/yy dates, EUR currency, top badges, compact spacing).
- Remove duplicate/legacy card code incrementally as each phase completes.

### Definitions
- "Adopt universal card" = replace per-entity JSX card blocks with `<UniversalEntityCard />` using proper props mapping, including:
  - `title`, optional `subtitle`, `description`, `imageUrl`
  - `broadstreet_id`, `mongo_id`, `entityType`
  - `topTags`, `bottomTags`, `statusBadge`, `displayData`, `parentsBreadcrumb`
  - `showCheckbox`, `isSelected`, `onSelect`, `onCardClick`, `onDelete`
  - Variant and `testId` as needed for lists

---

## Phase 1: Networks
Small Tasks:
1. Identify all places rendering network cards (e.g. `src/app/networks/page.tsx`).
2. Create a minimal mapping util `mapNetworkToUniversalProps(network): UniversalEntityCardProps`.
3. Replace network card JSX with `<UniversalEntityCard {...mapNetworkToUniversalProps(n)} />`.
4. Populate `displayData` (e.g. advertisers count, zones count, created date) with dd/mm/yy and EUR rules.
5. Add `parentsBreadcrumb` when context exists (e.g. network has none → omit).
6. Ensure ID badges show Broadstreet if present, else Mongo.
7. Add Playwright assertions for presence of title, IDs, and a sample tag.

Acceptance Criteria:
- Networks list renders only universal cards.
- No visual regressions in layout; lint/tests pass.

---

## Phase 2: Advertisers
Small Tasks:
1. Locate advertiser card renderers (e.g. `src/app/advertisers/page.tsx`).
2. Implement `mapAdvertiserToUniversalProps(advertiser)` including breadcrumb: `Network (BS/Mongo) > Advertiser`.
3. Replace JSX with universal card.
4. Fill `displayData` (campaigns, spend as EUR, last active dd/mm/yy).
5. Integrate action buttons (View/Edit) via `actionButtons`.
6. Add tests asserting dd/mm/yy and € formatting.

Acceptance Criteria:
- Advertisers list uses universal cards with breadcrumb.
- Spend shows `€` and dates show dd/mm/yy.

---

## Phase 3: Advertisements
Small Tasks:
1. Find advertisement card usages (e.g. `src/app/advertisements/AdvertisementsList.tsx`).
2. Implement `mapAdToUniversalProps(ad)` (imageUrl, size, CTR/progress, created date).
3. Replace JSX with universal card.
4. Top tags include quality markers (e.g. High CTR); status badge shows Live/Active.
5. Tests for image present vs none, progress bar rendering, and € replacement in any strings.

Acceptance Criteria:
- Ads render via universal card with correct progress/value formatting.

---

## Phase 4: Campaigns
Small Tasks:
1. Locate campaign cards (e.g. `src/app/campaigns/page.tsx`).
2. Implement `mapCampaignToUniversalProps(campaign)` with breadcrumb `Network > Advertiser > Campaign` where available.
3. Replace JSX with universal card.
4. `displayData`: Budget (EUR), Spent (progress), Start/End dd/mm/yy, placements count.
5. Status badge reflects Running/Paused.
6. Tests for dates dd/mm/yy, € symbol on budget, progress on spent.

Acceptance Criteria:
- Campaign lists/cards use universal card with breadcrumb and status.

---

## Phase 5: Placements
Small Tasks:
1. Replace placement renders (e.g. `src/app/placements/PlacementsList.tsx`).
2. Implement `mapPlacementToUniversalProps(placement)` with breadcrumb `Campaign > Advertisement > Zone` (as applicable).
3. `displayData`: Campaign, Advertisement, Zone names (truncate to 10 chars), Impressions, Performance progress.
4. Integrate delete for local-only placements using `onDelete`.
5. Tests for breadcrumb truncation and ID selection logic.

Acceptance Criteria:
- Placement list uses universal card; local delete works and stops propagation.

---

## Phase 6: Zones
Small Tasks:
1. Replace zone renders (e.g. `src/app/zones/ZonesList.tsx`).
2. Implement `mapZoneToUniversalProps(zone)`; breadcrumb `Network > Zone`.
3. `displayData`: size, network, daily views (formatted), fill rate progress.
4. Tests for dd/mm/yy where applicable and truncation rules.

Acceptance Criteria:
- Zones list uses universal card with correct metrics.

---

## Phase 7: Themes
Small Tasks:
1. Replace theme renders (`src/app/themes/...`).
2. Implement `mapThemeToUniversalProps(theme)`; breadcrumb as needed.
3. `displayData`: zones count, avg CTR progress, created/updated dates.
4. Integrate optional `onCopyToTheme` actions where applicable.

Acceptance Criteria:
- Themes render via universal card with correct EUR and date formats.

---

## Cross-Cutting Cleanup
Tasks:
1. Remove any now-unused card components and styles.
2. Centralize mapping helpers under `src/lib/ui/card-mappers.ts` (optional if helpful).
3. Ensure `EntityIdBadge` is only used inside universal card after migration.
4. Run Playwright regression: `tests/*card*.spec.ts` and `/test-page` visual check.

---

## Verification Checklist (each phase)
- [ ] Replaced all occurrences in the target area with `UniversalEntityCard`.
- [ ] Verified breadcrumb and ID display logic.
- [ ] Verified dd/mm/yy and € formatting.
- [ ] Verified actions (select, click, delete) don’t bubble incorrectly.
- [ ] No console warnings; lints pass.

## Rollback Plan
- Keep branch-per-phase. If issues occur, revert the phase and iterate without affecting others.
