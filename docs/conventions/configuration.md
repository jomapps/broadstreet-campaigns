# Configuration (Environment Variables)

Location
- Define variables in `.env.local` at the project root.
- Next.js automatically loads `.env.local`.
- Standalone Node.js scripts must load envs via `dotenv`.

Core variable
- REQUEST_RATE_LIMIT (seconds)
  - Controls Broadstreet API request pacing
  - `0` disables rate limiting (no artificial delay)
  - `> 0` waits that many seconds between requests
  - Referenced in: ../architecture/data-sync.md and ../integrations/broadstreet-api.md

Example `.env.local`

```
# Disable rate limiting during local development
REQUEST_RATE_LIMIT=0
```

Notes
- Keep values numeric (integers or decimals in seconds) if you support sub-second pacing.
- Document any new env variables here as you add them.

Cross-links
- Data sync behavior: ../architecture/data-sync.md
- Broadstreet API usage: ../integrations/broadstreet-api.md
- Variable origins registry (for shared variables): ../variable-origins.md

