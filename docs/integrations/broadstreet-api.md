# Broadstreet API Integration

Spec
- Canonical JSON spec: ../entity-reference/broadstreet-api-specs.json

Usage
- Respect pacing via REQUEST_RATE_LIMIT env (seconds): 0 = no rate limiting; >0 = delay between requests. Next.js reads .env.local automatically; Node scripts should load dotenv.
- Broadstreet preview URLs may require special handling (see Ads page patterns in app)

Sync Touchpoints
- Download (Dashboard “Sync Data”): refresh Broadstreet-sourced collections
- Upload (Local-Only “Upload to Broadstreet”): push local-only entities

Cross-links
- Data sync: ../architecture/data-sync.md
- Database rules: ../architecture/database-rules.md

