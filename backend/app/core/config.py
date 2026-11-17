"""Ilova sozlamalari — .env fayl yoki muhit o'zgaruvchilaridan o'qiladi."""
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


def _asyncpg_url(v: str) -> str:
    """'postgres://' yoki 'postgresql://' → asyncpg formatiga."""
    if v.startswith("postgres://"):
        v = "postgresql://" + v[len("postgres://"):]
    if v.startswith("postgresql://"):
        v = "postgresql+asyncpg://" + v[len("postgresql://"):]
    return v


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    # Ilova
    app_name: str = "Klinik audit inspeksiyasi API"
    debug: bool = True
    cors_origins: str = "http://localhost:3100"

    # DB
    database_url: str = "postgresql+asyncpg://localhost:5432/klinik_talim"
    test_database_url: str = "postgresql+asyncpg://localhost:5432/klinik_talim_test"

    # JWT / cookie
    jwt_secret: str = "CHANGE_ME"
    jwt_expire_days: int = 30
    cookie_name: str = "pa_token"
    cookie_secure: bool = False

    # Kontent
    content_dir: str = "../content"

    # O'quv qoidalari
    final_test_size: int = 15
    pre_test_size: int = 10
    review_batch: int = 10
    pass_percent: int = 80

    # Demo hisoblar
    demo_inspector_phone: str = "+998900000001"
    demo_inspector_password: str = ""
    demo_admin_phone: str = "+998900000002"
    demo_admin_password: str = ""
    demo_learner_password: str = ""

    @field_validator("database_url", "test_database_url", mode="after")
    @classmethod
    def _normalize(cls, v: str) -> str:
        return _asyncpg_url(v)

    @property
    def content_path(self) -> Path:
        p = Path(self.content_dir)
        return p if p.is_absolute() else (BACKEND_DIR / p).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
