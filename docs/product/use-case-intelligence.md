# Curated use-case intelligence

ThingsO use-case fit is a reviewed discovery layer, not a claim that every repository in a broad category implements every possible workflow.

For the first curated 100 repositories, use-case links are produced from the reviewed repository category using the versioned mapping in `apps/worker/src/thingso_worker/editorial_use_cases.py`. Only slugs explicitly activated by `packages/db/migrations/0004_curated_use_cases.sql` are public.

Each link stores a conservative fit score, a decision-oriented reason, `source_type = editorial`, the publishing analysis id, and `reviewed = true`. The production publication gate requires all 100 current repositories to have at least one reviewed curated use case linked to the current TH-107 V3 publication.

Repository relations are intentionally not inferred from shared category membership. Alternative, similar, integration, dependency, and complement relations require repository-specific evidence and remain empty when that evidence is absent.
