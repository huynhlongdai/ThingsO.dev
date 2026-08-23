from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://thingso:thingso@localhost:5432/thingso"
    github_token: str | None = None
    github_api_version: str = "2022-11-28"
    worker_concurrency: int = 4
    job_poll_interval_seconds: int = 5
