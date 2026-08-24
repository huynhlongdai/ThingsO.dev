# Repository Intelligence Quality v2

Repository Intelligence must be accurate before it is complete.

## Rules

1. Repository-specific claims must come from the current repository snapshot or captured source documents.
2. Category templates may help classify or seed search taxonomy, but they must not be published as repository-specific problem, differentiation, architecture, or capability claims.
3. Unknown is valid data. If evidence does not establish a claim, publish an empty list or an `unknown` claim instead of filler text.
4. Problem, pain points, differentiators, capabilities, trade-offs, and decision fields must have distinct semantic roles.
5. A profile fails publication if high-similarity duplicate content appears across fields that are expected to carry different meaning.
6. Confidence is derived from available evidence, never hard-coded solely by section name.
7. The current README may provide repository-specific semantics only when text is explicitly captured from relevant sections; deterministic extraction must not invent comparisons or capabilities.
8. Technology, codebase, commands, CI and deployment facts remain deterministic evidence-derived fields.

## Semantic roles

- Problem: the need/problem the repository explicitly addresses.
- Pain points: concrete difficulties or constraints described by project evidence.
- Solution approach: how the repository says it addresses the problem.
- Differentiators: explicit advantages, comparison claims, or unusual design choices stated by project evidence.
- Repository-stated capabilities: explicit feature/capability claims from project evidence; these are not automatically unique.
- Design philosophy: explicit principles or documented design choices.
- Design trade-offs: explicit limitations, caveats, constraints, or consequences of documented choices.

## Publication policy

The quality gate rejects exact or near-duplicate semantic fields and rejects category-template boilerplate masquerading as repository-specific differentiation. Sparse but evidence-backed profiles are preferred to complete-looking synthetic profiles.
