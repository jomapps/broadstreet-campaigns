# Variable Naming & Origins

Single source of truth
- Registry: ../variable-origins.md (MUST update when adding cross-cutting variables)

Conventions
- IDs: Only `broadstreet_id`, `mongo_id`, `_id` per ../entity-reference/ids.md
- Zustand store: follow naming from ../implementation/zustand-implementation.md (e.g., `selectedNetwork`, not `selectedNetworkId`)
- Use descriptive names aligned with the registry; avoid synonyms in different layers

Process
- Before introducing a new variable used by multiple functions, check ../variable-origins.md and add an entry with a one‑sentence description

Cross-links
- IDs canonical: ../entity-reference/ids.md
- Zustand patterns canonical: ../implementation/zustand-implementation.md

