from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, BaseSettings, EmailStr, HttpUrl, PostgresDsn, validator, Field

from dotenv import load_dotenv
import os


class Settings(BaseSettings):

    FIRST_SUPERUSER_EMAIL: str = os.environ["FIRST_SUPERUSER_EMAIL"]
    FIRST_SUPERUSER_FIRST_NAME: str = os.environ["FIRST_SUPERUSER_FIRST_NAME"]
    FIRST_SUPERUSER_LAST_NAME: str = os.environ["FIRST_SUPERUSER_FIRST_NAME"]
    FIRST_SUPERUSER_PASSWORD: str = os.environ["FIRST_SUPERUSER_PASSWORD"]
    POSTGRES_HOST: str = os.environ.get("POSTGRES_HOST")
    POSTGRES_PORT: str = os.environ.get("POSTGRES_PORT")
    POSTGRES_USER: str = os.environ.get("POSTGRES_USER")
    POSTGRES_PASSWORD: str = os.environ.get("POSTGRES_PASSWORD")
    POSTGRES_DB: str = os.environ.get("POSTGRES_DB")

    # SQLALCHEMY_DATABASE_URI: str = "sqlite:///./sql_app.db"
    POSTGRESQL_DATABASE_URI: Optional[str] = (
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")

    POSTGRESQL_DATABASE_CELERY_URI: Optional[str] = (
        f"db+postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")

    PostgresDsn.build(
        scheme="postgresql",
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        host=f"{POSTGRES_HOST}:{POSTGRES_PORT}",
        path=f"/{POSTGRES_DB or ''}",
    )
    POSTGRES_TEST_DB: str = POSTGRES_DB + "_test"
    POSTGRESQL_TEST_DATABASE_URI: Optional[str] = (
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_TEST_DB}")
    POSTGRESQL_ADMIN_DATABASE_URI: Optional[str] = (
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/postgres")

    SECRET_KEY: str = os.environ["SECRET_KEY"]
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    API_V1_STR: str = "/api/v1"

    BACKEND_CORS_ORIGINS: List = ["http://localhost:3000", "*"]  # type: ignore

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    MODEL_ASSETS_DIR: str = "model_assets"
    MODEL_THUMBNAILS_DIR: str = MODEL_ASSETS_DIR + "/thumnails"
    MODEL_IMAGES_DIR: str = MODEL_ASSETS_DIR + "/images"
    MODEL_WORKSPACES_DIR: str = MODEL_ASSETS_DIR + "/workspaces"
    PUBLIC_DIR:str = "public"
    PROJECT_NAME: str = os.environ["PROJECT_NAME"]

    EMAIL_CONFIRMATION_TOKEN_EXPIRE_HOURS: int = 24
    USERS_OPEN_REGISTRATION: bool = True
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48
    EMAIL_TEMPLATES_DIR: str = "email-templates"

class Config(BaseSettings):
    PROJECT_NAME: str = Field(..., env="PROJECT_NAME")
    PROJECT_DESCRIPTION: str = Field(..., env="PROJECT_DESCRIPTION")
    PROJECT_KEYWORDS: str = Field(..., env="PROJECT_KEYWORDS")
    PROJECT_ICON: str = Field(..., env="PROJECT_ICON")

    SERVER_HOST_FRONT: str = Field(..., env="SERVER_HOST_FRONT")

    SMTP_TLS: bool = Field(..., env="MAIL_TLS")
    SMTP_PORT: int = Field(..., env="SMTP_PORT")
    SMTP_HOST: str = Field(..., env="SMTP_HOST")
    SMTP_USER: str = Field(..., env="SMTP_USER")
    SMTP_PASSWORD: str = Field(..., env="SMTP_PASSWORD")
    EMAILS_FROM_EMAIL: str = Field(..., env="EMAILS_FROM_EMAIL")
    EMAILS_FROM_NAME: Optional[str] = Field(None, env="EMAILS_FROM_NAME")

    EMAILS_ENABLED: Optional[bool] = True

    GOOGLE_AUTH_CLIENT_ID: str = Field(..., env="GOOGLE_AUTH_CLIENT_ID")
    GOOGLE_AUTH_CLIENT_SECRET: str = Field(..., env="GOOGLE_AUTH_CLIENT_SECRET")

    STRIPE_API_KEY: Optional[str] = Field(None, env="STRIPE_API_KEY")
    STRIPE_PUBLIC_KEY: Optional[str] = Field(None, env="STRIPE_PUBLIC_KEY")
    STRIPE_MONTHLY_ID: Optional[str] = Field(None, env="STRIPE_MONTHLY_ID")
    STRIPE_YEARLY_ID: Optional[str] = Field(None, env="STRIPE_YEARLY_ID")
    SUPPORT_EMAIL: Optional[str] = Field(None, env="SUPPORT_EMAIL")

    @validator("SMTP_TLS", pre=True)
    def parse_bool(cls, v):
        return v.upper() == "TRUE" if isinstance(v, str) else bool(v)

    @validator("EMAILS_FROM_NAME", always=True)
    def default_from_name(cls, v, values: Dict[str, Any]) -> str:
        return v or values.get("PROJECT_NAME", "")

    @validator("EMAILS_ENABLED", always=True)
    def get_emails_enabled(cls, v: bool, values: Dict[str, Any]) -> bool:
        return bool(
            values.get("SMTP_HOST")
            and values.get("SMTP_PORT")
            and values.get("EMAILS_FROM_EMAIL")
        )

    class Config:
        env_file = "/code/app/core/.backend.env"
        env_file_encoding = "utf-8"

settings: Settings = Settings()
