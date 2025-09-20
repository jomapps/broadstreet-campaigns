# Sync Operations

Download (Dashboard “Sync Data”)
- Clear and refresh Broadstreet-sourced collections
- Preserve local-only collections and themes
- Apply REQUEST_RATE_LIMIT (seconds) between requests; set 0 for no delay

Upload (Local-Only “Upload to Broadstreet”)
- Validate local-only entities
- Upload to Broadstreet and map returned `broadstreet_id`
- Migrate entities from Local* to synced collections as appropriate

Cross-links
- Data sync: ../architecture/data-sync.md
- Database rules: ../architecture/database-rules.md

