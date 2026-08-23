# ADR-005 — AI Provenance and Publication Boundary

Status: Accepted for V1

## Context

ThingsO uses models to interpret repository documentation and propose use cases/limitations/relationships. Repository-controlled text can contain incorrect data or prompt-injection instructions.

## Decision

Store source facts, AI inferences and editorial overrides as distinct provenance classes. AI output must be schema-valid, versioned by model/prompt/schema, tied to source snapshot/document IDs, and independently reviewed before becoming the current public analysis.

Repository text is untrusted quoted evidence. Model instructions contained inside README/issues/code are never followed.

## Consequences

- Public pages can explain where a claim came from.
- Re-enrichment creates a new analysis version instead of rewriting history.
- AI failures do not prevent factual repository pages from rendering.
- Extra storage/review complexity is accepted in exchange for trustworthiness.

## Revisit trigger

The provenance model may be extended, but the separation between facts and inference must not be removed without Owner/CEO approval.
