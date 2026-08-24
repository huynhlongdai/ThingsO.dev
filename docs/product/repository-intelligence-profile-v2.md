# Repository Intelligence Profile v2

Status: proposed implementation contract
Owner: Product + Research + Engineering

## Why v2 exists

The V1 repository analysis is useful for discovery but too shallow for decision intelligence. It tells a reader what capabilities a repository has, but not enough about the problem it solves, why it is distinct, how it is designed, how a developer works with the codebase, what it takes to operate, or when it should be chosen over alternatives.

V2 must let a technical reader answer four questions without leaving ThingsO:

1. What is this project, what problem does it solve, and why does it matter?
2. Is it a fit for my use case, team, stack, constraints, and maturity level?
3. How is it built, organized, extended, tested, deployed, and operated?
4. What should I compare it with, what are the trade-offs, and what could I build with it?

## Profile sections

### 1. Executive understanding

- One-line definition
- What it is
- Problem statement
- Solution approach
- Why it matters
- What is distinctive / differentiators
- Project positioning: library, framework, platform, application, infrastructure, protocol, developer tool, research project, or mixed
- Target users and target teams
- Core jobs-to-be-done

### 2. Fit and decision guide

- Best-fit scenarios
- Poor-fit / avoid-if scenarios
- Adoption triggers
- Key trade-offs
- Learning curve
- Integration complexity
- Operational complexity
- Lock-in / portability considerations
- Evaluation checklist
- Migration or integration notes

### 3. Capabilities and workflows

- Core capabilities
- Core workflows
- Interfaces
- Deployment modes
- Use-case fit scores and reasons
- Known limitations
- Explicit non-goals when evidence supports them

### 4. Technical architecture

- Architecture style
- Primary languages
- Frameworks and important libraries
- Runtime model
- Core components/modules
- Data/control flow
- Storage model
- External services and dependencies
- Protocols and APIs
- Extension points / plugin model
- Integration surface
- State model: stateless, persistent, event-driven, queue-based, etc.
- Concurrency / execution model when observable

### 5. Repository and developer experience

- Repository structure and major directories
- Important entry points
- Package/workspace structure
- Build system and package managers
- Local development workflow
- Configuration model
- Test strategy
- Lint/type-check/static-analysis tooling
- CI/CD approach
- Release/versioning approach
- Contribution workflow
- Documentation quality notes
- Where a new developer should start reading the code
- Development risks / complexity hotspots

### 6. Operations and production readiness

- Deployment patterns
- Required infrastructure
- Persistence requirements
- Scaling model
- Observability/logging/metrics
- Security considerations
- Data/privacy considerations
- Resource profile where evidence supports it
- Failure modes / operational risks
- Upgrade and maintenance risk

### 7. Ecosystem and adoption

- Project maturity
- Community/adoption context
- Integration ecosystem
- Important related repositories
- Alternatives
- Complementary projects
- License implications
- Commercial/hosted offering context when factual and relevant

### 8. Build intelligence

- Build ideas
- Reusable architectural patterns found in the repository
- Components that can be reused independently
- Suggested product combinations with other repositories
- What can realistically be built on top of it

### 9. Evidence and provenance

Every V2 profile remains tied to:

- current repository snapshot
- captured source documents
- evidence references
- author/provider provenance
- model/editor provenance
- schema version
- confidence
- review status

Facts and inferences must remain visually and structurally distinguishable.

## V2 minimum publication gate

A V2 profile cannot be marked approved unless it contains, at minimum:

- one-line definition
- problem statement
- solution approach
- at least two differentiators
- target users
- at least two best-fit scenarios
- at least one poor-fit scenario
- technical architecture summary
- at least three core components or architecture elements
- repository/developer workflow notes
- repository structure notes
- operational profile
- at least one trade-off
- current snapshot and source-document evidence
- confidence >= 0.70

Unknown information must be represented as unknown/not established from evidence rather than invented.

## Repository page information architecture

Recommended reading order:

1. Hero: one-line definition + health + source links + compare
2. What it does
3. Problem → approach → why it is different
4. Best for / not ideal for
5. Core workflows and capabilities
6. Architecture at a glance
7. Technology stack and runtime
8. Repository map and development workflow
9. Integration and extension points
10. Deployment and operations
11. Trade-offs and risks
12. Use-case fit
13. Alternatives / related repositories
14. Build ideas
15. Deterministic project health
16. Source facts and provenance

The repository page should read like a technical product brief, architecture review, and adoption guide rather than a decorated GitHub metadata page.

## Compatibility

V1 analyses remain readable. V2 is additive in `output_json`; no destructive database migration is required for the first implementation. Web rendering should gracefully fall back to V1 when a V2 profile is not yet available.
