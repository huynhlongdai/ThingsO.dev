# AI Intelligence V1

ThingsO treats AI output as a versioned inference layer, never as source truth.

## Pipeline

1. `EvidenceBuilder` loads the repository's current factual snapshot and latest captured source documents.
2. Source text is bounded and scanned for instruction-like prompt-injection patterns.
3. The enrichment model returns `repo-analysis-v1` structured JSON.
4. The draft is persisted with source snapshot/document IDs and `pending` review state.
5. An independent review prompt evaluates the draft against the same evidence.
6. Local trust gates can override an AI approval to `human_review`.
7. Only `approved` analyses publish AI taxonomy/use-case/relation mappings and Build Ideas.

## Trust boundaries

- GitHub metadata and captured documents are source evidence.
- Repository documents are untrusted content; text inside them can never change ThingsO instructions.
- Deterministic Project Health Score remains separate from AI analysis.
- AI use cases are created as `proposed` taxonomy entities until editorial promotion.
- AI relations only publish when the target repository already exists in ThingsO.
- Every stored analysis records schema version, prompt version, provider, model, source snapshot, source document IDs, confidence and review status.

## Runtime configuration

The worker uses an OpenAI-compatible `/chat/completions` JSON endpoint configured by `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL_ENRICH` and optionally `AI_MODEL_REVIEW`.

No provider secret is stored in the repository.

## Evaluation

`data/evals/repository-analysis-gold.json` is the first regression set. Production model changes must be evaluated against curated expected categories and forbidden claim drift before rollout.
