from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://thingso:thingso@localhost:5432/thingso"
    github_token: str | None = None
    github_api_version: str = "2022-11-28"

    ai_provider: str = "openai-compatible"
    ai_api_key: str | None = None
    ai_base_url: str = "https://api.openai.com/v1"
    ai_model_enrich: str = ""
    ai_model_review: str = ""
    ai_timeout_seconds: float = 90.0
    ai_max_source_chars: int = 24000

    worker_concurrency: int = 4
    job_poll_interval_seconds: int = 5
