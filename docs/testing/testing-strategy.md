# Testing Strategy

How to run
- Prefer smallest scope: single test → file → package
- It’s safe to run unit/integration tests locally; they don’t modify external state

What to test
- ID conventions: only `broadstreet_id`, `mongo_id`, `_id`
- Database rules: synced entities are never deleted; exception only during dashboard Sync
- Filters: theme/zone exclusivity; network selection persistence; campaign ordering rules
- Sync flow: REQUEST_RATE_LIMIT-driven pacing (0 = no rate limit), correct collection separation, and migration on upload

Cross-links
- IDs: ../entity-reference/ids.md
- Data sync: ../architecture/data-sync.md
- Sidebar filters: ../frontend/sidebar-filters.md

