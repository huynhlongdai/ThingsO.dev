# ThingsO.dev

> Discover → Analyze → Compare → Build

ThingsO is an open-source decision-intelligence platform for developers and technical founders. It helps users describe what they want to build, discover relevant repositories and tools, understand project health and trade-offs, compare alternatives, and turn a selected stack into a build idea or blueprint.

## Monorepo

- `apps/web` — Next.js public product and BFF
- `apps/worker` — Python ingestion/enrichment worker
- `packages/contracts` — shared API/data contracts
- `packages/db` — migrations and database helpers
- `packages/scoring` — deterministic project-health scoring
- `packages/taxonomy` — taxonomy definitions and seeds
- `packages/analytics` — analytics event contracts
- `data` — curated seed and evaluation data
- `docs` — architecture and methodology
- `tests` — cross-service tests

## Development

```bash
corepack enable
pnpm install
pnpm dev
```

Worker setup:

```bash
cd apps/worker
uv sync
uv run python -m thingso_worker
```

Local Postgres:

```bash
docker compose up -d postgres
```

See `.env.example` for required environment variables.
