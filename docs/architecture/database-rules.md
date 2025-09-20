# Database Rules (CRITICAL)

Hard rules
- Never delete synced entities during normal operations (advertisers, zones, campaigns, ads, placements, etc.)
- EXCEPTION: During “Sync Data”, Broadstreet-sourced collections are cleared and refreshed
- Never delete synced placements from Placement collection (audit delete-all only affects Local* collections)
- Local-only entities are separate (e.g., LocalAdvertiser) until uploaded

ID conventions
- Only use these fields: `broadstreet_id`, `mongo_id`, and MongoDB native `_id`
- Avoid generic `id`
- Follow canonical IDs spec: ../entity-reference/ids.md

Misc rules
- Default network is hardcoded to “FASH Medien Verlag GmbH - SCHWULISSIMO 9396” (ID 9396) on init

Cross-links
- Data sync: ./data-sync.md
- Entity models: ../data-models/overview.md
- Canonical IDs: ../entity-reference/ids.md

