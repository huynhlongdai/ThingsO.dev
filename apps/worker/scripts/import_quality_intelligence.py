from __future__ import annotations

import argparse
import json

import thingso_worker.manual_intelligence as manual_intelligence
from thingso_worker.ai_models import AnalysisReview
from thingso_worker.quality_editorial import evidence_only_review_issues
from thingso_worker.semantic_depth import (
    DEPTH_MODEL,
    DEPTH_PROMPT_VERSION,
    DEPTH_REVIEW_MODEL,
)
from thingso_worker.settings import Settings


def _evidence_depth_review(bundle, profile) -> AnalysisReview:
    issues = evidence_only_review_issues(bundle, profile)
    decision = "approved" if not any(issue.severity == "high" for issue in issues) else "human_review"
    return AnalysisReview(
        decision=decision,
        confidence=min(profile.confidence, 0.95),
        issues=issues,
        rationale=(
            "Evidence-depth Repository Intelligence passed evidence-pack, sparse-schema, provenance, "
            "semantic de-duplication, and evidence-only publication gates. Unknown fields remain publishable."
            if decision == "approved"
            else "Evidence-depth Repository Intelligence failed one or more deterministic publication gates."
        ),
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("path")
    args = parser.parse_args()

    # Reuse the proven transaction/publishing path while versioning the deeper deterministic
    # compiler independently from evidence-only v1. Sparse/Unknown fields remain valid.
    manual_intelligence.PROMPT_VERSION = DEPTH_PROMPT_VERSION
    manual_intelligence.MODEL = DEPTH_MODEL
    manual_intelligence.REVIEW_MODEL = DEPTH_REVIEW_MODEL
    manual_intelligence._review = _evidence_depth_review

    settings = Settings()
    results = manual_intelligence.import_manual_intelligence(settings.database_url, args.path)
    print(json.dumps([result.as_dict() for result in results], indent=2))


if __name__ == "__main__":
    main()
