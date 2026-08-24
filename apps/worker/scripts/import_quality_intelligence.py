from __future__ import annotations

import argparse
import json

import thingso_worker.manual_intelligence as manual_intelligence
from thingso_worker.ai_models import AnalysisReview
from thingso_worker.quality_editorial import (
    QUALITY_MODEL,
    QUALITY_PROMPT_VERSION,
    evidence_only_review_issues,
)
from thingso_worker.settings import Settings


def _evidence_only_review(bundle, profile) -> AnalysisReview:
    issues = evidence_only_review_issues(bundle, profile)
    decision = "approved" if not any(issue.severity == "high" for issue in issues) else "human_review"
    return AnalysisReview(
        decision=decision,
        confidence=min(profile.confidence, 0.95),
        issues=issues,
        rationale=(
            "Evidence-only Repository Intelligence passed evidence-pack, sparse-schema, provenance, "
            "and semantic de-duplication gates. Unknown fields are intentionally publishable."
            if decision == "approved"
            else "Evidence-only Repository Intelligence failed one or more deterministic publication gates."
        ),
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("path")
    args = parser.parse_args()

    # Reuse the proven transaction/publishing path, but version it independently and replace
    # the legacy completeness review. Evidence-only profiles are allowed to say "unknown".
    manual_intelligence.PROMPT_VERSION = QUALITY_PROMPT_VERSION
    manual_intelligence.MODEL = QUALITY_MODEL
    manual_intelligence.REVIEW_MODEL = "deterministic-evidence-only-review-v1"
    manual_intelligence._review = _evidence_only_review

    settings = Settings()
    results = manual_intelligence.import_manual_intelligence(settings.database_url, args.path)
    print(json.dumps([result.as_dict() for result in results], indent=2))


if __name__ == "__main__":
    main()
