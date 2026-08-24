# Repository Intelligence Profile v3

Status: **frozen for the curated-100 rollout**.

ThingsO repository intelligence is structured technical decision data derived from repository evidence. It is not an AI-written README summary. The schema and evidence contract are provider-independent so an AI provider can replace the current manual editorial reasoning later without changing the product data model.

## Product questions

Every publishable profile should help a reader answer:

1. What is this repository and what role does it play?
2. What problem does it solve and what pain exists without it?
3. How does its solution work and what makes it different?
4. Who is it for, what jobs does it serve, and when is it a poor fit?
5. How is it architected and how do data/control/state move through it?
6. Which technologies are used, and what role does each technology play?
7. How is the codebase organized and where should a developer start reading?
8. How does a developer set it up, build, test, debug, contribute, and release it?
9. How can it be integrated or extended?
10. How is it deployed, operated, scaled, backed up, observed, and recovered?
11. What security/privacy boundaries and unknowns are visible from public evidence?
12. What are the maturity, governance, licensing, adoption, ecosystem, and evolution signals?
13. When should a team choose it, avoid it, and what should it evaluate first?
14. What reusable architecture/product/learning patterns can be taken from it?
15. Which claims are facts, inferences, unknown, or conflicting, and what evidence supports them?

## Provenance classes

Facts, derived metrics, evidence-backed inference, and editorial judgment must remain distinguishable.

- `source`: directly captured repository facts/documents.
- deterministic derived metrics: versioned scoring such as `health-v1`.
- `ai`: model inference when an automated provider is enabled.
- `editorial`: reviewed/manual reasoning, currently `chatgpt-gpt-5.6-sol-manual`.

The current manual pipeline publishes relational intelligence as `editorial`, never disguised as `ai`.

## Evidence Pack v2

A normal curated repository is refreshed with:

- GitHub repository metadata and language statistics;
- README;
- recursive repository tree (bounded representation);
- up to five diverse technical files selected from manifest/build, container/runtime/configuration, contribution/security, CI, and architecture/development documentation.

The selector is deliberately bounded for GitHub API reliability. Repository evidence can be deepened later without changing the V3 schema.

### Evidence tiers

**Tier 1 — universal**: metadata, README, tree, primary manifest/build file.

**Tier 2 — curated**: runtime/container/config, CI, contribution/security, architecture/development docs.

**Tier 3 — targeted deep inspection**: selected source entry points/call paths for high-priority repositories when architecture cannot be established from Tier 1–2.

## Knowledge states

Claims use one of:

- `known`: directly supported by public evidence;
- `inferred`: reasonable technical interpretation supported by evidence;
- `unknown`: not established from available evidence;
- `conflicting`: evidence sources disagree or describe incompatible states.

Unknown is valid data. The pipeline must prefer an explicit unknown over fabrication.

## Canonical sections

`repo-intelligence-v3` contains:

- Identity
- Problem & solution
- Differentiation
- Audience / jobs-to-be-done / fit
- Capabilities and limitations
- Architecture
- Technology roles
- Semantic codebase map
- Developer workflow
- Integration and extension model
- Deployment and operations
- Security and privacy
- Project signals: maturity, governance, licensing, adoption, ecosystem, evolution
- Decision guide
- Learning/reuse intelligence
- Deployment modes / interfaces / taxonomy
- Use-case fit
- Repository relations
- Build Ideas
- Bound evidence references
- Section-level confidence
- Overall confidence

## Architecture contract

Technology names are not an architecture description. A publishable profile must model at minimum:

- architecture overview and style;
- execution model;
- state model;
- at least three meaningful components with responsibilities;
- data/control flow when evidence permits;
- persistence, concurrency, isolation and scaling as known/inferred/unknown claims.

## Developer intelligence contract

The profile separates repository structure from developer workflow.

Codebase intelligence should explain important paths, entry points, where to start reading, and extension points. Developer workflow records evidence-backed local setup plus build/test/lint/typecheck/debug/migration/CI/contribution/release information, explicitly marking absent evidence as unknown.

## Operations and security contract

Deployment information distinguishes a minimum deployment from a production topology. Operations cover services, persistence, configuration, scaling, observability, backup/upgrade, recovery, resource profile and operational risks.

Security/privacy data is descriptive technical intelligence, not a security certification. Authentication, authorization, secrets, network exposure, sandboxing, tenancy, persisted data, external data flow and telemetry remain unknown when public evidence does not establish them.

## Decision contract

A profile is incomplete if it only describes features. Decision intelligence must contain:

- at least two `choose_when` scenarios;
- at least one `avoid_when` scenario;
- at least two items to evaluate before adoption;
- meaningful trade-offs;
- learning curve, operational complexity, migration cost and lock-in estimates, using `unknown` when not supportable;
- comparison dimensions useful for later cross-repository comparison.

## Publication gate

`deterministic-intelligence-review-v3` requires:

- valid `repo-intelligence-v3` schema;
- current repository snapshot;
- README evidence;
- repository-tree evidence;
- at least one additional technical evidence document;
- overall confidence >= 0.70;
- technology roles present;
- important codebase paths present;
- architecture style and execution model established;
- local development setup established;
- minimum deployment established;
- evidence selectors on core sections that resolve to the ingested Evidence Pack;
- explicit section confidence >= 0.50 for identity, problem, architecture, technology, codebase, developer workflow, deployment/operations and decision.

A repository that cannot pass is kept for human/deeper evidence review rather than published as complete V3 intelligence.

## Freshness and versioning

An approved profile is bound to a repository snapshot and source-document IDs. A new snapshot/evidence refresh can produce a new profile instead of mutating historical intelligence. This enables future staleness indicators and change intelligence.

## UX order

Repository pages are intelligence-first, not star-count-first:

1. Definition / problem / solution
2. Differentiation
3. Best fit / poor fit / decision
4. Architecture
5. Technology
6. Codebase map
7. Developer workflow
8. Integration and extension
9. Deployment and operations
10. Security and privacy
11. Project signals and learning
12. Use cases / relations / Build Ideas
13. Deterministic health
14. GitHub source facts
15. Evidence and provenance

## Curated-100 rollout

Rollout gates are 10 → 25 → 50 → 100, but all batches use this same frozen V3 schema. No batch may fall back to the shallow V1 profile merely to reach a coverage number. The final milestone is 100 ingested repositories with refreshed Evidence Pack v2 and 100 approved `repository_intelligence` / `repo-intelligence-v3` analyses.
