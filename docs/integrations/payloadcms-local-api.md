# PayloadCMS Local API (Server-Side)

Pattern (Next.js server-first)
1) Await `searchParams` in the server component
2) Load required data server-side using PayloadCMS Local API
3) Keep user selection in context (e.g., Zustand) per documented patterns

Notes
- Prefer server-side data loading for easier testing and consistent behavior
- Avoid client-only data fetching unless necessary

Further reading
- Zustand patterns (canonical): ../implementation/zustand-implementation.md

