from datetime import datetime, timedelta, timezone

from thingso_worker.scoring import HEALTH_SCORE_VERSION, calculate_health_score


def base_facts(now: datetime) -> dict:
    return {
        "is_archived": False,
        "created_at_source": now - timedelta(days=800),
        "pushed_at_source": now - timedelta(days=5),
        "stars": 5000,
        "forks": 800,
        "subscribers": 100,
        "contributor_count": 40,
        "readme_present": True,
        "description": "A useful project",
        "homepage_url": "https://example.com",
        "release_count": 12,
        "latest_release_at": now - timedelta(days=20),
        "license_spdx": "MIT",
        "primary_language": "Python",
        "default_branch": "main",
    }


def test_health_score_is_bounded_and_deterministic():
    now = datetime(2026, 8, 23, tzinfo=timezone.utc)
    first = calculate_health_score(base_facts(now), now=now)
    second = calculate_health_score(base_facts(now), now=now)
    assert first == second
    assert 0 <= first.total <= 100
    assert HEALTH_SCORE_VERSION == "health-v1"


def test_archived_repo_has_zero_maintenance():
    now = datetime(2026, 8, 23, tzinfo=timezone.utc)
    facts = base_facts(now)
    facts["is_archived"] = True
    score = calculate_health_score(facts, now=now)
    assert score.maintenance == 0


def test_missing_license_and_readme_reduce_evidence():
    now = datetime(2026, 8, 23, tzinfo=timezone.utc)
    complete = calculate_health_score(base_facts(now), now=now)
    facts = base_facts(now)
    facts["license_spdx"] = None
    facts["readme_present"] = False
    incomplete = calculate_health_score(facts, now=now)
    assert incomplete.license_clarity == 0
    assert incomplete.documentation < complete.documentation
    assert incomplete.total < complete.total
