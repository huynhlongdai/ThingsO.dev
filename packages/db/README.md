# @thingso/db

Canonical PostgreSQL schema and migrations for ThingsO.

## Principles

- `repositories` stores stable identity/current pointers.
- `repository_snapshots` stores immutable factual observations.
- AI analyses are versioned and never overwrite source facts.
- Relations/taxonomy/use-case mappings preserve their source type.
- Background jobs are DB-backed for V1.

## Apply locally

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f packages/db/migrations/0001_initial.sql
```

The migration intentionally enables `pgcrypto` and `pg_trgm`. `pgvector` is not required until the semantic-search ADR approves production use.
