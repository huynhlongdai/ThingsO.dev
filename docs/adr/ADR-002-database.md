# ADR-002 — Database

Status: Accepted for V1

## Context

ThingsO needs canonical repository facts, immutable snapshots, taxonomy/use-case relations, job state, search documents, analytics-adjacent product data and optional embeddings.

## Options

1. Supabase PostgreSQL.
2. Multiple specialized databases from launch.
3. Document database as primary store.

## Decision

Use PostgreSQL as the system of record, with Supabase as the preferred managed provider. Use PostgreSQL extensions such as `pg_trgm`, full-text search and `pgvector` only where justified.

## Consequences

- One source of truth for transactional data and search-adjacent structures.
- SQL migrations define contracts.
- No Redis/Elasticsearch/vector database is required initially.
- Postgres operational limits must be monitored as data volume grows.

## Revisit trigger

Introduce specialized infrastructure only when measured latency, throughput or ranking requirements exceed a documented PostgreSQL threshold.
