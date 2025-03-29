from celery import Celery  # type: ignore
from time import sleep
from celery.utils.log import get_task_logger  # type: ignore
import os
from app.core.config import settings
import emails  # type: ignore
from emails.template import JinjaTemplate  # type: ignore
from typing import Any, Dict

celery_app = Celery('tasks')
celery_app.conf.broker_url = os.environ.get(
    "CELERY_BROKER_URL", "redis://localhost:6379")
celery_app.conf.result_backend = os.environ.get(
    "CELERY_RESULT_BACKEND", "redis://localhost:6379")

celery_app.conf.update(imports=['app.core.celery_app'])
celery_log = get_task_logger(__name__)

@celery_app.task
def print_test_message(quantity: int) -> bool:
    """Print message with 2 second interval."""
    for i in range(quantity):
        sleep(2)
        celery_log.info(f"Task {i} completed!")
    return True


@celery_app.task
def send_email_async(
    email_to: str,
    subject_template: str = "",
    html_template: str = "",
    environment: Dict[str, Any] = {},
) -> None:
    """Send email asynchronously"""
    assert settings.EMAILS_ENABLED, "no provided configuration for email variables"
    message = emails.Message(
        subject=JinjaTemplate(subject_template),
        html=JinjaTemplate(html_template),
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}
    if settings.SMTP_TLS:
        smtp_options["tls"] = True
    if settings.SMTP_USER:
        smtp_options["user"] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp_options["password"] = settings.SMTP_PASSWORD
    message.send(to=email_to, render=environment, smtp=smtp_options)
