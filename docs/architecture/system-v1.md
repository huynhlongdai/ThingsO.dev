# ThingsO V1 System Architecture

```text
Browser
  |
Cloudflare DNS / WAF / CDN
  |
Next.js Web + BFF
  |
PostgreSQL (Supabase preferred)
  |  \
  |   +-- FTS / pg_trgm
  |   +-- pgvector only after benchmark approval
  |
Python Worker
  |  \
  |   +-- GitHub REST/GraphQL
  |   +-- AI provider adapter
  |
DB-backed ingestion_jobs
```

## Deployable units

V1 has two deployable application services:

1. `apps/web`
2. `apps/worker`

PostgreSQL is managed infrastructure, not an application microservice.

## Failure boundaries

- Failed AI enrichment does not remove factual repository data.
- Failed refresh preserves the last-good snapshot.
- Job retries are bounded and observable.
- Public web reads do not depend on a live GitHub call.

## Environment boundaries

Local, staging and production use separate credentials. Agents operate against local/staging unless explicitly authorized for production.
