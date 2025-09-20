# Project Overview

Broadstreet Campaigns is a dual-database application that syncs entities from the Broadstreet API into local MongoDB, while supporting local-only workflows prior to upload.

Key components
- Dashboard with explicit sync actions (no background polling)
- Entity management for Networks, Advertisers, Zones, Campaigns, Advertisements, and Placements
- Local-only entities maintained separately until uploaded

Start here
- Architecture overview: ../architecture/architecture-overview.md
- Data sync model: ../architecture/data-sync.md
- Database rules (CRITICAL): ../architecture/database-rules.md
- Canonical IDs reference: ../entity-reference/ids.md
- Zustand patterns (canonical): ../implementation/zustand-implementation.md

Contributing
- Follow naming and variable origins: ../conventions/variable-naming.md and ../variable-origins.md
- Keep new pages small (<200 lines) and cross‑link to canonical docs

