# UI Preferences

Cards & IDs
- Universal card design across entities
- Show campaign name/id, ad name/id, and zone name/id on placement cards
- Local-only entities display MongoDB IDs with small local badges; style cards with yellowish accent
- Breadcrumbs should wrap to multiple lines (no ellipsis truncation)

Lists & Filters
- Prefer dropdown selects (not radio) when there are many options
- Sidebar filters: theme selection replaces currently selected zones; cannot have a theme without its zones displayed
- Network selection should NOT reset when clearing other sidebar filters
- Campaigns: group running (active=true) first, paused (active=false) after; avoid extra filter dropdowns

Loading UX
- Use suspense/loading animations for long-running queries

Cross-links
- Cards: ../frontend/universal-card.md
- Sidebar filters: ../frontend/sidebar-filters.md
- Campaigns display: ../frontend/campaigns-display.md

