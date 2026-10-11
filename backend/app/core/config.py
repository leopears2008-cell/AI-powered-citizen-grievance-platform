from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    log_level: str = "INFO"
    database_url: str = "sqlite:///./dev.db"
    secret_key: str = Field(default="", repr=False)
    gemini_api_key: str = Field(default="", repr=False)
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"
    access_token_minutes: int = 15
    refresh_token_days: int = 7

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    def validate_for_runtime(self) -> None:
        if len(self.secret_key) < 32:
            raise RuntimeError("SECRET_KEY must be set to at least 32 characters.")


@lru_cache
def get_settings() -> Settings:
    return Settings()
