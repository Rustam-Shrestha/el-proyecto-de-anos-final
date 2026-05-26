"""
Configuration Module - Environment Settings

Loads and validates environment variables for the KYC service.
"""

import logging
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # Runtime
    NODE_ENV: str = "development"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:admin@localhost:5432/finguard"

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = False

    # File Upload
    UPLOAD_DIR: str = "uploads/kyc"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB

    # OCR Settings
    PADDLE_OCR_LANG: list = ["hi", "en"]
    OCR_CONFIDENCE_THRESHOLD: float = 0.5
    OCR_FIELD_MATCH_THRESHOLD: int = 60

    # Face Verification
    FACE_MATCH_THRESHOLD: float = 0.4
    FACE_MODEL: str = "VGG-Face"

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore unknown fields from .env


settings = Settings()

# Configure logging (accept case-insensitive level names)
level_name = (settings.LOG_LEVEL or "INFO").upper()
level_value = getattr(logging, level_name, logging.INFO)
logging.basicConfig(
    level=level_value,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

__all__ = ["settings"]
