from __future__ import annotations

import json

import psycopg

from thingso_worker.intelligence_models import RepositoryIntelligenceProfileV3
from thingso_worker.quality_editorial import QUALITY_MODEL, QUALITY_PROMPT_VERSION, quality_issues
from thingso_worker.settings import Settings

TARGET_REPOSITORY = "TauricResearch/TradingAgents"


def main() -> None:
    settings = Settings()
    with psycopg.connect(settings.database_url) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT count(*) FROM repositories WHERE current_snapshot_id IS NOT NULL")
            current_repositories = int(cur.fetchone()[0])

            cur.execute(
                """
                SELECT DISTINCT ON (r.id)
                  r.full_name,
                  a.output_json,
                  a.confidence
                FROM repositories r
                JOIN ai_analyses a ON a.repository_id = r.id
                WHERE r.current_snapshot_id IS NOT NULL
                  AND a.source_snapshot_id = r.current_snapshot_id
                  AND a.analysis_type = 'repository_intelligence'
                  AND a.schema_version = 'repo-intelligence-v3'
                  AND a.model_provider = 'editorial'
                  AND a.model_name = %s
                  AND a.prompt_version = %s
                  AND a.review_status = 'approved'
                ORDER BY r.id, a.created_at DESC
                """,
                (QUALITY_MODEL, QUALITY_PROMPT_VERSION),
            )
            rows = cur.fetchall()

            cur.execute(
                """
                SELECT count(*)
                FROM ai_analyses a
                JOIN repositories r ON r.id = a.repository_id
                WHERE r.current_snapshot_id IS NOT NULL
                  AND a.source_snapshot_id = r.current_snapshot_id
                  AND a.model_name = %s
                  AND a.prompt_version = %s
                  AND a.review_status <> 'approved'
                """,
                (QUALITY_MODEL, QUALITY_PROMPT_VERSION),
            )
            non_approved = int(cur.fetchone()[0])

    failures: list[str] = []
    target: dict[str, object] | None = None

    for full_name, output_json, stored_confidence in rows:
        try:
            profile = RepositoryIntelligenceProfileV3.model_validate(output_json)
        except Exception as exc:  # noqa: BLE001 - QA should report malformed persisted profiles together.
            failures.append(f"{full_name}: persisted profile failed schema validation: {exc}")
            continue

        issues = quality_issues(profile)
        if issues:
            failures.append(f"{full_name}: {'; '.join(issues)}")

        if str(full_name).lower() == TARGET_REPOSITORY.lower():
            target = {
                "full_name": full_name,
                "problem": profile.problem.problem_statement,
                "pain_points": profile.problem.pain_points,
                "solution_approach": profile.problem.solution_approach,
                "why_it_matters": profile.problem.why_it_matters,
                "differentiators": profile.differentiation.differentiators,
                "unique_capabilities": profile.differentiation.unique_capabilities,
                "architecture_components": len(profile.architecture.components),
                "overall_confidence": profile.confidence,
                "stored_confidence": float(stored_confidence),
                "provider_model": QUALITY_MODEL,
                "prompt_version": QUALITY_PROMPT_VERSION,
            }

    if current_repositories < 100:
        failures.append(f"Expected at least 100 current repositories, found {current_repositories}")
    if len(rows) != current_repositories:
        failures.append(
            f"Evidence-only coverage mismatch: {len(rows)} approved profiles for {current_repositories} current repositories"
        )
    if non_approved:
        failures.append(f"Found {non_approved} non-approved current evidence-only analyses")
    if target is None:
        failures.append(f"Target QA repository {TARGET_REPOSITORY} is missing from approved evidence-only profiles")

    report = {
        "current_repositories": current_repositories,
        "approved_evidence_only_profiles": len(rows),
        "non_approved_evidence_only_profiles": non_approved,
        "semantic_failures": len(failures),
        "target_repository": target,
    }
    print(json.dumps(report, indent=2, ensure_ascii=False))

    if failures:
        raise SystemExit("Post-publication intelligence QA failed:\n" + "\n".join(failures))


if __name__ == "__main__":
    main()
