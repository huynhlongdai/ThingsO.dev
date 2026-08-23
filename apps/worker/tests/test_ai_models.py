from thingso_worker.ai_models import RepositoryAnalysis


def test_repository_analysis_normalizes_taxonomy_slugs() -> None:
    analysis = RepositoryAnalysis(
        summary="A sufficiently descriptive repository summary for validation.",
        taxonomy_slugs=["AI-Agent", "bad slug!", "ai-agent"],
        confidence=0.7,
    )
    assert analysis.taxonomy_slugs == ["ai-agent"]


def test_repository_analysis_rejects_out_of_range_confidence() -> None:
    try:
        RepositoryAnalysis(
            summary="A sufficiently descriptive repository summary for validation.",
            confidence=1.2,
        )
    except ValueError:
        return
    raise AssertionError("Expected confidence validation failure")
