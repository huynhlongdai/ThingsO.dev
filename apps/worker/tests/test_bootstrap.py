from thingso_worker.settings import Settings


def test_settings_have_safe_defaults() -> None:
    settings = Settings()
    assert settings.worker_concurrency > 0
    assert settings.github_api_version
