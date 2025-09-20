# Data Models Overview

Collections
- Synced: Networks, Advertisers, Zones, Campaigns, Advertisements, Placements
- Local-only: separate Local* collections (e.g., LocalAdvertiser) until uploaded, then appear in synced collections after Broadstreet assignment

ID Conventions
- Use only: `broadstreet_id`, `mongo_id`, `_id`
- Full details: ../entity-reference/ids.md

Entity References (canonical)
- Advertisers: ../entity-reference/advertisers.md
- Campaigns: ../entity-reference/campaigns.md
- Zones: ../entity-reference/zones.md
- Placements: ../entity-reference/placement.md
- Database models summary: ../entity-reference/database-models.md

Cross-links
- Sync operations: ../architecture/data-sync.md
- Database rules: ../architecture/database-rules.md

