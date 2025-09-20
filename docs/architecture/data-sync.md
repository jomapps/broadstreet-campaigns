# Data Sync

Principles
- Exactly two explicit sync points:
  1) Dashboard “Sync Data” → Download from Broadstreet
  2) Local-Only “Upload to Broadstreet” → Upload local-only entities
- No background polling; all changes happen on demand
- During Dashboard Sync, fully refresh all Broadstreet-sourced collections while preserving local-only collections and theme data
- Prefer drop-and-resync for major structure changes (for clean starts)
- Respect API pacing via env: REQUEST_RATE_LIMIT (seconds). 0 disables rate limiting; >0 waits that many seconds between requests

Collections
- Synced: Networks, Advertisers, Zones, Campaigns, Advertisements, Placements (read-only except during sync)
- Local-only: separate Local* collections until uploaded

Cross-links
- Database rules: ./database-rules.md
- Models overview: ../data-models/overview.md
- Upload behavior: ../guides/sync-operations.md

