import math
from fastapi_pagination.ext.sqlalchemy import _to_dict, paginate_query
from fastapi_pagination.bases import AbstractPage, AbstractParams
from fastapi_pagination.api import create_page, resolve_params
from sqlalchemy.orm import Query  # type: ignore
from typing import Optional
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Optional

import emails  # type: ignore
from emails.template import JinjaTemplate  # type: ignore
from jose import jwt  # type: ignore

from app.core.config import settings
from app.core.logging import logger
from app.celery.celery_app import send_email_async


def send_email(
    email_to: str,
    subject_template: str = "",
    html_template: str = "",
    environment: Dict[str, Any] = {},
) -> None:
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
    response = message.send(to=email_to, render=environment, smtp=smtp_options)
    logger.error(f"send email result: {response}")


def send_test_email(email_to: str) -> None:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Test email"
    with open(Path(settings.EMAIL_TEMPLATES_DIR) / "test_email.html") as f:
        template_str = f.read()
    send_email_async.delay(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={"project_name": settings.PROJECT_NAME, "email": email_to},
    )


def send_reset_password_email(email_to: str, email: str, token: str) -> None:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Password recovery for user {email}"
    with open(Path(settings.EMAIL_TEMPLATES_DIR) / "reset_password.html") as f:
        template_str = f.read()
    server_host = settings.SERVER_HOST_FRONT
    link = f"{server_host}/reset-password?token={token}"
    send_email_async.delay(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={
            "project_name": settings.PROJECT_NAME,
            "email": email_to,
            "valid_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": link,
        },
    )


def send_new_account_email(email_to: str, token: str) -> None:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - New account"
    with open(Path(settings.EMAIL_TEMPLATES_DIR) / "new_account.html") as f:
        template_str = f.read()
    link = f"{settings.SERVER_HOST_FRONT}/confirm-email?token={token}"
    send_email_async.delay(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={
            "project_name": settings.PROJECT_NAME,
            "email": email_to,
            "link": link,
        },
    )

def send_subscription_success_email(
    email_to: str, 
    user_name: str, 
    plan_name: str, 
    amount: float, 
    currency: str,
    created_date: datetime,
    expired_date: datetime,
) -> None:
    """
    Send a confirmation email to users after successful subscription payment.
    
    Args:
        email_to: Email address of the recipient
        user_name: Name of the user who subscribed
        plan_name: Name of the subscription plan (e.g., "Basic", "Premium")
        amount: Amount paid for the subscription
        currency: Currency of the payment (e.g., "usd")
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Subscription Confirmation"
    
    # Read email template
    with open(Path(settings.EMAIL_TEMPLATES_DIR) / "subscription_success.html") as f:
        template_str = f.read()
    
    # Generate dashboard link
    dashboard_link = f"{settings.SERVER_HOST_FRONT}/dashboard"
    
    # Format currency for display
    formatted_amount = f"{amount:.2f}"
    currency_upper = currency.upper()
    
    # Send email asynchronously
    send_email_async.delay(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={
            "project_name": settings.PROJECT_NAME,
            "user_name": user_name,
            "email": email_to,
            "plan_name": plan_name,
            "amount": formatted_amount,
            "currency": currency_upper,
            "dashboard_link": dashboard_link,
            "created_date": created_date.strftime("%Y-%m-%d %H:%M:%S"),
            "expired_date": expired_date.strftime("%Y-%m-%d %H:%M:%S"),
            "support_email": settings.SUPPORT_EMAIL,
        },
    )


def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.utcnow()
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "email": email}, settings.SECRET_KEY, algorithm="HS256",
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> Optional[str]:
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"])
        return decoded_token["email"]
    except jwt.JWTError:
        return None


def generate_mail_confirmation_token(email: str) -> str:
    delta = timedelta(hours=settings.EMAIL_CONFIRMATION_TOKEN_EXPIRE_HOURS)
    now = datetime.utcnow()
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "email": email}, settings.SECRET_KEY, algorithm="HS256",
    )
    return encoded_jwt


def verify_mail_confirmation_token(token: str) -> Optional[str]:
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"])
        return decoded_token["email"]
    except jwt.JWTError:
        return None


def paginate(query: Query, params: Optional[AbstractParams] = None) -> AbstractPage:
    params = resolve_params(params)
    total = query.count()
    items = [_to_dict(item) for item in paginate_query(query, params)]
    return create_page(items, total, params)
