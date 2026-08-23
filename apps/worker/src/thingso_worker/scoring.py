from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

import psycopg
from psycopg.rows import dict_row


HEALTH_SCORE_VERSION = "health-v1"


@dataclass(frozen=True)
class HealthScore:
    total: float
    maintenance: float
    adoption: float
    community: float
    documentation: float
    operations: float
    license_clarity: float
    maturity: float
    metadata: float


def _clamp(value: float) -> float:
    return max(0.0, min(100.0, value))


def _round(value: float) -> float:
    return round(value, 3)


def _days_between(now: datetime, then: datetime | None) -> float | None:
    if then is None:
        return None
    return max(0.0, (now - then).total_seconds() / 86400)


def _recency_score(days: float | None) -> float:
    if days is None:
        return 0
    if days <= 7:
        return 100
    if days <= 30:
        return 92
    if days <= 90:
        return 78
    if days <= 180:
        return 60
    if days <= 365:
        return 40
    if days <= 730:
        return 18
    return 5


def _log_score(value: int | None, cap: int) -> float:
    safe = max(0, value or 0)
    return _clamp(math.log1p(min(safe, cap)) / math.log1p(cap) * 100)


def calculate_health_score(facts: dict, *, now: datetime | None = None) -> HealthScore:
    current = now or datetime.now(timezone.utc)
    archived = bool(facts.get("is_archived"))
    maintenance = 0 if archived else _recency_score(_days_between(current, facts.get("pushed_at_source")))
    adoption = _clamp(_log_score(facts.get("stars"), 100_000) * 0.7 + _log_score(facts.get("forks"), 20_000) * 0.3)
    community = _clamp(
        _log_score(facts.get("contributor_count"), 200) * 0.5
        + _log_score(facts.get("subscribers"), 2_000) * 0.2
        + _log_score(facts.get("forks"), 10_000) * 0.3
    )
    documentation = _clamp(
        (60 if facts.get("readme_present") else 0)
        + (20 if facts.get("description") else 0)
        + (20 if facts.get("homepage_url") else 0)
    )
    operations = _clamp(
        _log_score(facts.get("release_count"), 20) * 0.4
        + _recency_score(_days_between(current, facts.get("latest_release_at"))) * 0.6
    )
    license_value = str(facts.get("license_spdx") or "").strip().upper()
    license_clarity = 0 if not license_value else (30 if license_value in {"NOASSERTION", "OTHER"} else 100)
    age_days = _days_between(current, facts.get("created_at_source"))
    maturity = 0 if age_days is None else _clamp(min(age_days, 1095) / 1095 * 100)
    metadata = _clamp(
        (35 if facts.get("description") else 0)
        + (35 if facts.get("primary_language") else 0)
        + (30 if facts.get("default_branch") else 0)
    )
    total = (
        maintenance * 0.25
        + adoption * 0.15
        + community * 0.15
        + documentation * 0.15
        + operations * 0.10
        + license_clarity * 0.05
        + maturity * 0.10
        + metadata * 0.05
    )
    return HealthScore(
        total=_round(total),
        maintenance=_round(maintenance),
        adoption=_round(adoption),
        community=_round(community),
        documentation=_round(documentation),
        operations=_round(operations),
        license_clarity=_round(license_clarity),
        maturity=_round(maturity),
        metadata=_round(metadata),
    )


class HealthScoreStore:
    def __init__(self, database_url: str) -> None:
        self.database_url = database_url

    def calculate_and_persist(self, full_name: str) -> UUID:
        with psycopg.connect(self.database_url, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT r.id AS repository_id, r.current_snapshot_id AS snapshot_id,
                           r.description, r.homepage_url, r.is_archived, r.created_at_source,
                           r.pushed_at_source, r.default_branch,
                           s.stars, s.forks, s.subscribers, s.primary_language, s.license_spdx,
                           s.release_count, s.latest_release_at, s.contributor_count,
                           EXISTS (
                             SELECT 1 FROM source_documents d
                             WHERE d.repository_id = r.id AND d.document_type = 'readme'
                           ) AS readme_present
                    FROM repositories r
                    JOIN repository_snapshots s ON s.id = r.current_snapshot_id
                    WHERE lower(r.full_name) = lower(%s)
                    """,
                    (full_name,),
                )
                facts = cur.fetchone()
                if not facts:
                    raise LookupError(f"Repository has no current snapshot: {full_name}")
                score = calculate_health_score(dict(facts))
                cur.execute(
                    """
                    INSERT INTO repository_scores (
                      repository_id, snapshot_id, score_version, total_score,
                      maintenance_score, adoption_score, community_score, documentation_score,
                      operations_score, license_clarity_score, maturity_score, metadata_score
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (repository_id, snapshot_id, score_version) DO UPDATE SET
                      total_score = EXCLUDED.total_score,
                      maintenance_score = EXCLUDED.maintenance_score,
                      adoption_score = EXCLUDED.adoption_score,
                      community_score = EXCLUDED.community_score,
                      documentation_score = EXCLUDED.documentation_score,
                      operations_score = EXCLUDED.operations_score,
                      license_clarity_score = EXCLUDED.license_clarity_score,
                      maturity_score = EXCLUDED.maturity_score,
                      metadata_score = EXCLUDED.metadata_score,
                      calculated_at = now()
                    RETURNING id
                    """,
                    (
                        facts["repository_id"], facts["snapshot_id"], HEALTH_SCORE_VERSION,
                        score.total, score.maintenance, score.adoption, score.community,
                        score.documentation, score.operations, score.license_clarity,
                        score.maturity, score.metadata,
                    ),
                )
                score_id = cur.fetchone()["id"]
            conn.commit()
        return score_id
