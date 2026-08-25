# Repository Readiness v1

Status: **frozen for curated-100 product readiness**.

Repository readiness is a deterministic completeness signal for the current approved `repo-intelligence-v3` profile. It is deliberately separate from provenance, review approval, claim confidence, Project Health Score, and use-case Fit Score.

## Why this exists

`approved` answers one question only: **may this evidence-backed profile be shown publicly?**

It does not mean the evidence pack is complete enough to support every adoption or implementation decision. Evidence-only publication intentionally keeps missing knowledge as `unknown`, so ThingsO needs a separate signal for how far a reader can safely take the profile.

## Four stages

### 1. Evidence-safe

The profile is current-snapshot, schema-valid, reviewed and approved for public display. Unknowns and sparse sections are allowed.

This stage does **not** imply that the repository is understood deeply enough for an adoption decision.

### 2. Analyzed

The profile has enough evidence to explain the repository beyond its identity. The deterministic readiness model expects most of:

- repository-specific problem and solution;
- capability or technology-role evidence;
- codebase reading/entry-point evidence;
- architecture evidence;
- multiple distinct evidence selectors.

### 3. Decision-ready

In addition to being analyzed, the profile has enough evidence for a meaningful adoption discussion. The model checks:

- best-fit / choose-when context;
- poor-fit / avoid-when / limitation context;
- pre-adoption evaluation criteria;
- explicit trade-offs;
- minimum deployment;
- operational complexity;
- architecture context.

Decision-ready does not mean universally recommended or production-safe. Fit remains use-case-specific.

### 4. Blueprint-ready

In addition to being decision-ready, the profile has most implementation-critical evidence needed to turn the blueprint into a higher-confidence execution guide:

- local setup or runnable commands;
- implementation code paths;
- execution/component architecture;
- integration/extension boundary;
- production deployment/configuration context;
- at least one security/data boundary;
- an implementation validation backlog.

Blueprint-ready still does not mean the repository has passed a security audit, legal review, load test or product-demand validation.

## Coverage versus confidence

**Claim confidence** estimates confidence in published interpretation.

**Readiness coverage** is the fraction of deterministic readiness checks currently established.

A profile can have high claim confidence and low readiness coverage when the claims that are present are well-supported but important sections are still unknown. The UI must never present confidence as a substitute for completeness.

## Relationship to other ThingsO signals

- **Approval / provenance**: whether intelligence may be published and how it was produced.
- **Readiness**: how complete the current profile is for analysis, decision and implementation.
- **Project Health Score**: deterministic project-condition signals.
- **Fit Score**: use-case-specific suitability.

None of these is a universal software quality score.

## UI rules

- Repository detail shows readiness beside, not inside, claim confidence.
- Compare exposes readiness for every candidate before the detailed matrix.
- Unknowns remain visible at every stage.
- Blueprint remains current-snapshot fail-closed. For profiles below blueprint-ready, unresolved readiness items are treated as a verification backlog rather than hidden or filled with guesses.
- A readiness label never changes source provenance or review status.

## Versioning

The implementation is `repository-readiness-v1`. Its checks and thresholds are deterministic and regression-tested. Any material change to stage semantics must create a new readiness version or explicitly migrate this contract.
