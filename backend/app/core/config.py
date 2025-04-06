from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, BaseSettings, EmailStr, HttpUrl, PostgresDsn, validator

from dotenv import load_dotenv
import os


class Settings(BaseSettings):
    load_dotenv()
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.environ["SECRET_KEY"]
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    SERVER_NAME: str = "3DScene App Server"
    SERVER_HOST_FRONT: AnyHttpUrl = os.environ[  # type: ignore
        "SERVER_HOST_FRONT"
    ]
    # BACKEND_CORS_ORIGINS is a JSON-formatted list of origins
    # e.g: '["http://localhost", "http://localhost:4200", "http://localhost:3000", \
    # "http://localhost:8080", "http://local.dockertoolbox.tiangolo.com"]'
    BACKEND_CORS_ORIGINS: List = ["http://localhost:3000", "*"]  # type: ignore

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    PROJECT_NAME: str = os.environ["PROJECT_NAME"]
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
    # PostgresDsn.build(
    #     scheme="postgresql",
    #     user=POSTGRES_USER,
    #     password=POSTGRES_PASSWORD,
    #     host=f"{POSTGRES_HOST}:{POSTGRES_PORT}",
    #     path=f"/{POSTGRES_TEST_DB or ''}",
    # )

    SMTP_TLS: bool = True if os.environ["MAIL_TLS"].upper(
    ) == "TRUE" else False
    SMTP_PORT: int = int(os.environ["SMTP_PORT"])
    SMTP_HOST: str = os.environ["SMTP_HOST"]
    SMTP_USER: str = os.environ["SMTP_USER"]
    SMTP_PASSWORD: str = os.environ["SMTP_PASSWORD"]
    EMAILS_FROM_EMAIL: EmailStr = os.environ[  # type: ignore
        "EMAILS_FROM_EMAIL"
    ]
    EMAILS_FROM_NAME: str = os.environ["EMAILS_FROM_NAME"]

    @validator("EMAILS_FROM_NAME")
    def get_project_name(cls, v: Optional[str], values: Dict[str, Any]) -> str:
        if not v:
            return values["PROJECT_NAME"]
        return v

    EMAIL_CONFIRMATION_TOKEN_EXPIRE_HOURS: int = 24
    USERS_OPEN_REGISTRATION: bool = True
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48
    EMAIL_TEMPLATES_DIR: str = "email-templates"
    EMAILS_ENABLED: bool = True

    @validator("EMAILS_ENABLED", pre=True)
    def get_emails_enabled(cls, v: bool, values: Dict[str, Any]) -> bool:
        return bool(
            values.get("SMTP_HOST")
            and values.get("SMTP_PORT")
            and values.get("EMAILS_FROM_EMAIL")
        )

    # Google OAuth2 authentication
    GOOGLE_AUTH_CLIENT_ID: str = os.environ["GOOGLE_AUTH_CLIENT_ID"]
    GOOGLE_AUTH_CLIENT_SECRET: str = os.environ["GOOGLE_AUTH_CLIENT_SECRET"]

    UPLOAD_VIDEO_DIR: str = "uploads"
    RESULT_DIR: str = "results"
    SPLAT_THUMBNAILS_DIR = "thumbnails"


settings: Settings = Settings()
