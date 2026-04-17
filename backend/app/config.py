"""Configuration settings for the AI Agent Platform."""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from functools import lru_cache
from typing import Optional
from pathlib import Path

# Resolve .env from project root (one level up from this file's directory)
_env_path = Path(__file__).parent.parent.parent / ".env"
_is_vercel = bool(os.getenv("VERCEL"))
_default_db_url = "sqlite:////tmp/ai_agent_platform.db" if _is_vercel else "sqlite:///./ai_agent_platform.db"
_default_chroma_dir = "/tmp/chroma_db" if _is_vercel else "./chroma_db"
_settings_env_file = None if _is_vercel else (str(_env_path) if _env_path.exists() else ".env")


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=_settings_env_file,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = _default_db_url
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Groq LLM
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    
    # WhatsApp Cloud API
    WHATSAPP_ACCESS_TOKEN: Optional[str] = None
    WHATSAPP_PHONE_NUMBER_ID: Optional[str] = None
    WHATSAPP_VERIFY_TOKEN: Optional[str] = None
    WHATSAPP_WEBHOOK_URL: Optional[str] = None
    
    # Telegram
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_WEBHOOK_URL: Optional[str] = None
    
    # Meta/Instagram
    META_APP_ID: Optional[str] = None
    META_APP_SECRET: Optional[str] = None
    META_ACCESS_TOKEN: Optional[str] = None
    META_VERIFY_TOKEN: Optional[str] = None
    INSTAGRAM_BUSINESS_ACCOUNT_ID: Optional[str] = None
    
    # Gmail
    GMAIL_CLIENT_ID: Optional[str] = None
    GMAIL_CLIENT_SECRET: Optional[str] = None
    GMAIL_REDIRECT_URI: str = "http://localhost:8000/auth/gmail/callback"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # App
    APP_NAME: str = "AI Agent Platform"
    APP_URL: str = "http://localhost:3000"
    API_URL: str = "http://localhost:8000"
    DEBUG: bool = False

    # CORS
    CORS_ALLOWED_ORIGINS: str = "*"
    
    # Chroma
    CHROMA_PERSIST_DIRECTORY: str = _default_chroma_dir
    
    # Embeddings
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    @property
    def cors_allowed_origins(self) -> list[str]:
        """Return normalized CORS origins list from comma-separated env var."""
        origins = [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]
        return origins or ["*"]

    @model_validator(mode="after")
    def validate_production_settings(self):
        """Enforce required secrets in production deployments."""
        if self.ENVIRONMENT.lower() == "production":
            if not self.SECRET_KEY or self.SECRET_KEY == "your-secret-key-change-in-production":
                raise ValueError("SECRET_KEY must be set to a secure value in production")
            if not self.DATABASE_URL:
                raise ValueError("DATABASE_URL must be set in production")
        return self
    
@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
