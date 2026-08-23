# ADR-004 — Search Architecture

Status: Accepted for V1

## Context

ThingsO search must support exact repository names, typo tolerance, descriptive keywords, taxonomy/use-case filters and natural-language build intent. Launch scale is roughly 500 curated repositories.

## Decision

Start with a PostgreSQL lexical baseline:

1. exact/name ranking,
2. `pg_trgm` similarity,
3. PostgreSQL full-text search,
4. taxonomy/use-case fit,
5. bounded health/freshness reranking.

Run an offline embedding experiment against a fixed 100-query benchmark. Add `pgvector` to production only if semantic retrieval materially improves top-k relevance for intent queries at acceptable latency/cost.

## Consequences

- Search has a measurable baseline before AI complexity.
- Health never dominates semantic relevance.
- Vector search is an evidence-based decision, not a default dependency.

## Revisit trigger

Adopt hybrid/vector retrieval when benchmark gains are material and operational cost is acceptable, or replace Postgres search when measured production requirements exceed it.
