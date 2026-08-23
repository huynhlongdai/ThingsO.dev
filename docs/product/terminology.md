# ThingsO V1 Terminology

This document freezes product language for the MVP.

## Core product language

- **ThingsO** — the product/brand at `thingso.dev`.
- **Repository** — a canonical GitHub repository entity. UI may use “repo” in compact labels, but API/database naming uses `repository`.
- **Project Health Score** — deterministic, versioned evidence about maintenance/adoption/community/documentation/operations/license clarity/maturity/metadata completeness. It is not a universal quality score.
- **Source Fact** — value fetched or deterministically derived from a verified source.
- **AI Inference** — model-generated interpretation based on bounded evidence.
- **Editorial Override** — human/owner-reviewed correction or curation decision.
- **Use Case** — a normalized job a user wants to accomplish, such as “control a browser with an AI agent”.
- **Fit Score** — query/use-case-specific suitability estimate. Fit is not health.
- **Alternative** — a project that can satisfy substantially the same use case.
- **Similar Project** — related project that may not be substitutable.
- **Build Idea** — reviewed conceptual product/use-case proposal built around one or more repositories/tools.
- **Build Blueprint** — an interactive implementation plan describing components, candidate tools/repos, integration assumptions and unresolved questions. P1 unless capacity allows.
- **Contextual Offer** — verified commercial/hosted option shown because it is relevant to a build/deployment context. It never silently changes organic ranking.
- **Useful Decision Session (UDS)** — a session where a user performs at least two meaningful decision actions after discovery.

## Product promise

**Discover → Analyze → Compare → Build**

The word “Analyze” means ThingsO combines source facts with clearly labelled interpretation. It does not imply full source-code auditing in V1.

## Prohibited/ambiguous wording

Do not use these without qualification:

- “repo quality score” → use **Project Health Score**.
- “safe for commercial use” → show detected license and obligations caveat instead.
- “secure” / “production safe” → use factual security/maintenance signals only when sourced.
- “best repo” → use **best fit for [use case]** when evidence supports it.
- “AI verified” → use **AI reviewed** or **evidence-backed inference**.

## Naming conventions

- UI heading: `ThingsO`
- Domain display: `thingso.dev`
- API entity: `repository`
- Database tables: plural snake_case
- URL repository route: `/repos/{owner}/{name}`
- Taxonomy slugs: lowercase kebab-case and immutable after public indexing.
