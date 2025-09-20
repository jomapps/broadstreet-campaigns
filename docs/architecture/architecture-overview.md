# Architecture Overview

Layers
- Broadstreet API → Sync service → MongoDB (synced collections)
- Local-only layer → Local* collections (e.g., LocalAdvertiser)
- Next.js app (server-first pages), PayloadCMS Local API for server-side data loading
- Zustand store for UI state (follow canonical patterns)

Data flow
1) Download (Dashboard “Sync Data”): refresh Broadstreet-sourced collections
2) Local-only operations (create/edit in Local* collections)
3) Upload (Local-Only “Upload to Broadstreet”): push local-only entities upstream

Cross-links
- Data sync details: ./data-sync.md
- Database rules: ./database-rules.md
- Entity models: ../data-models/overview.md
- Broadstreet API spec: ../entity-reference/broadstreet-api-specs.json

