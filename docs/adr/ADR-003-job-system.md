# ADR-003 — Background Job System

Status: Accepted for V1

## Context

Repository refresh, README fetching, AI enrichment, scoring and index refresh are asynchronous and retryable. MVP scale does not justify Kafka or a dedicated queue cluster.

## Decision

Use a database-backed job table processed by the Python worker. Jobs are idempotent, priority-aware, lockable, retryable with bounded exponential backoff, and recoverable after stale locks.

## Consequences

- Minimal infrastructure and easy inspection through admin tools.
- Transactional coordination with repository state.
- Throughput is intentionally limited compared with dedicated queue systems.

## Revisit trigger

Move to a dedicated queue only after job throughput/latency or database contention becomes a demonstrated bottleneck.
