# Repository Intelligence Profile v3

Status: **schema frozen for the curated-100 rollout; publication completeness is governed by Repository Readiness v1**.

ThingsO repository intelligence is structured technical decision data derived from repository evidence. It is not an AI-written README summary. The schema and evidence contract are provider-independent so an AI provider can replace the current editorial reasoning later without changing the product data model.

## Product questions

A mature profile should help a reader answer:

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

Publication does not require every question to have a positive answer. Missing public evidence remains `unknown`; completeness is expressed through Repository Readiness rather than filler.

## Provenance classes

Facts, derived metrics, evidence-backed inference, and editorial judgment must remain distinguishable.

- `source`: directly captured repository facts/documents.
- deterministic derived metrics: versioned scoring such as `health-v1`.
- `ai`: model inference when an automated provider is enabled.
- `editorial`: reviewed/manual reasoning.

The editorial pipeline publishes relational intelligence as `editorial`, never disguised as `ai`.

## Evidence Pack v2

A normal curated repository is refreshed with:

- GitHub repository metadata and language statistics;
- README;
- recursive repository tree (bounded representation);
- bounded diverse technical files selected from manifest/build, container/runtime/configuration, contribution/security, CI, and architecture/development documentation.

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

Technology names are not an architecture description. The schema can represent:

- architecture overview and style;
- execution model;
- state model;
- meaningful components with responsibilities;
- data/control flow;
- persistence, concurrency, isolation and scaling as known/inferred/unknown claims.

Architecture evidence may be sparse in an evidence-safe profile. Architecture completeness contributes to analyzed, decision-ready and blueprint-ready stages rather than being fabricated to satisfy publication.

## Developer intelligence contract

The profile separates repository structure from developer workflow.

Codebase intelligence explains important paths, entry points, where to start reading, and extension points when public evidence establishes them. Developer workflow records evidence-backed local setup plus build/test/lint/typecheck/debug/migration/CI/contribution/release information, explicitly marking absent evidence as unknown.

## Operations and security contract

Deployment information distinguishes a minimum deployment from a production topology. Operations cover services, persistence, configuration, scaling, observability, backup/upgrade, recovery, resource profile and operational risks when evidenced.

Security/privacy data is descriptive technical intelligence, not a security certification. Authentication, authorization, secrets, network exposure, sandboxing, tenancy, persisted data, external data flow and telemetry remain unknown when public evidence does not establish them.

## Decision contract

Decision intelligence may contain:

- `choose_when` scenarios;
- `avoid_when` scenarios;
- items to evaluate before adoption;
- meaningful trade-offs;
- learning curve, operational complexity, migration cost and lock-in estimates, using `unknown` when not supportable;
- comparison dimensions useful for cross-repository comparison.

The presence and completeness of these fields determine decision readiness. The publication pipeline must not invent them merely to make an evidence-safe profile appear decision-ready.

## Publication approval versus readiness

These are separate product contracts.

### Approval

An approved profile is safe to publish because it is current-snapshot, schema-valid, provenance-bound and has passed the active deterministic semantic/review gates. Approval means **evidence-safe public intelligence**. It does not promise that all sections are complete.

### Repository Readiness v1

Readiness deterministically evaluates how far the approved profile can support a user:

1. `evidence-safe` — publishable with explicit Unknowns;
2. `analyzed` — enough repository-specific technical evidence for meaningful analysis;
3. `decision-ready` — enough fit, trade-off, architecture and operating evidence for an adoption discussion;
4. `blueprint-ready` — enough implementation, integration, production and security evidence for a higher-confidence blueprint.

See `docs/product/repository-readiness-v1.md` for the versioned checks and UI rules.

### Confidence is not completeness

Section/overall confidence describes confidence in the interpretation that is present. It must not be presented as evidence coverage or readiness. A sparse profile can contain high-confidence claims and still remain evidence-safe or analyzed rather than decision-ready.

## Freshness and versioning

An approved profile is bound to a repository snapshot and source-document IDs. A new snapshot/evidence refresh produces or reconciles a current profile instead of mutating historical intelligence. This enables staleness indicators and change intelligence while keeping decision/blueprint surfaces current-snapshot fail-closed.

## UX order

Repository pages are decision-first, not star-count-first:

1. Repository identity / definition
2. Decision Snapshot with readiness, health, license, deployment and major fit signals
3. Problem / solution
4. Differentiation
5. Capabilities / limitations
6. Best fit / poor fit / decision
7. Architecture
8. Technology
9. Codebase map
10. Developer workflow
11. Integration and extension
12. Deployment and operations
13. Security and privacy
14. Project signals and learning
15. Use cases / relations / Build Ideas
16. Deterministic health / GitHub source facts / evidence

Deep technical sections may use progressive disclosure; Unknowns must remain discoverable and clearly differentiated from known/inferred claims.

## Curated-100 rollout

Rollout gates are 10 → 25 → 50 → 100 using the same frozen V3 schema. The curated-100 milestone separates two measurements:

- **coverage gate**: every curated repository has a current approved evidence-safe V3 profile;
- **readiness distribution**: how many profiles are analyzed, decision-ready and blueprint-ready.

Scaling beyond curated-100 should use readiness distribution and product-quality metrics rather than treating `100 approved` as proof that all 100 repositories are equally complete.
