from fastapi_pagination.ext.sqlalchemy import _to_dict, paginate_query
from fastapi_pagination.bases import AbstractPage, AbstractParams
from fastapi_pagination.api import create_page, resolve_params
from sqlalchemy.orm import Query
from typing import Optional
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Optional

import emails
from emails.template import JinjaTemplate
from jose import jwt

from app.core.config import settings, Config
from app.core.logging import logger
from app.celery.celery_app import send_email_async


def send_email(
    email_to: str,
    subject_template: str = "",
    html_template: str = "",
    environment: Dict[str, Any] = {},
) -> None:
    config = Config()
    assert config.EMAILS_ENABLED, "no provided configuration for email variables"
    message = emails.Message(
        subject=JinjaTemplate(subject_template),
        html=JinjaTemplate(html_template),
        mail_from=(config.EMAILS_FROM_NAME, config.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": config.SMTP_HOST, "port": config.SMTP_PORT}
    if config.SMTP_TLS:
        smtp_options["tls"] = True
    if config.SMTP_USER:
        smtp_options["user"] = config.SMTP_USER
    if config.SMTP_PASSWORD:
        smtp_options["password"] = config.SMTP_PASSWORD
    response = message.send(to=email_to, render=environment, smtp=smtp_options)
    logger.error(f"send email result: {response}")


def send_test_email(email_to: str) -> None:
    config = Config()
    project_name = config.PROJECT_NAME
    subject = f"{project_name} - Test email"
    with open(Path(settings.EMAIL_TEMPLATES_DIR) / "test_email.html") as f:
        template_str = f.read()
    send_email_async.delay(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={"project_name": config.PROJECT_NAME, "email": email_to},
    )



def send_reset_password_email(email_to: str, email: str, token: str) -> None:
    """
    Send a password reset email to users who request to recover their password.
    
    Args:
        email_to: Email address to send the reset link to
        email: Email address associated with the account (may be the same as email_to)
        token: Password reset verification token
    """
    config = Config()
    project_name = config.PROJECT_NAME
    subject = f"{project_name} - Password Reset Request"
    
    # Read email template
    with open(Path(settings.EMAIL_TEMPLATES_DIR) / "reset_password.html") as f:
        template_str = f.read()
    
    # Generate password reset link with token
    server_host = config.SERVER_HOST_FRONT
    link = f"{server_host}/reset-password?token={token}"
    
    # Send email asynchronously
    send_email_async.delay(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={
            "project_name": config.PROJECT_NAME,
            "email": email,
            "valid_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": link,
        },
    )

def send_new_account_email(email_to: str, token: str) -> None:
    """
    Send an email verification email to new users after account creation.
    
    Args:
        email_to: Email address of the new user
        token: Verification token for email confirmation
    """
    config = Config()
    project_name = config.PROJECT_NAME
    subject = f"{project_name} - Confirm Your Email Address"
    
    # Read email template
    with open(Path(settings.EMAIL_TEMPLATES_DIR) / "new_account.html") as f:
        template_str = f.read()
    
    # Generate confirmation link with token
    link = f"{config.SERVER_HOST_FRONT}/confirm-email?token={token}"
    
    # Send email asynchronously
    send_email_async.delay(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={
            "project_name": config.PROJECT_NAME,
            "email": email_to,
            "link": link,
        },
    )

def send_new_google_account_email(email_to: str) -> None:
    """
    Send a confirmation email to users after connecting their Google account.
    
    Args:
        email_to: Email address of the user who connected their Google account
    """
    config = Config()
    project_name = config.PROJECT_NAME
    subject = f"{project_name} - Google Account Connected"
    
    # Read email template
    with open(Path(settings.EMAIL_TEMPLATES_DIR) / "new_google_account.html") as f:
        template_str = f.read()
    
    # Generate dashboard link
    dashboard_link = f"{config.SERVER_HOST_FRONT}/dashboard"
    
    # Send email asynchronously
    send_email_async.delay(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={
            "project_name": config.PROJECT_NAME,
            "email": email_to,
            "dashboard_link": dashboard_link,
            "support_email": config.SUPPORT_EMAIL,
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
    config = Config()
    project_name = config.PROJECT_NAME
    subject = f"{project_name} - Subscription Confirmation"
    
    # Read email template
    with open(Path(settings.EMAIL_TEMPLATES_DIR) / "subscription_success.html") as f:
        template_str = f.read()
    
    # Generate dashboard link
    dashboard_link = f"{config.SERVER_HOST_FRONT}/dashboard"
    
    # Format currency for display
    formatted_amount = f"{amount:.2f}"
    currency_upper = currency.upper()
    
    # Send email asynchronously
    send_email_async.delay(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={
            "project_name": config.PROJECT_NAME,
            "user_name": user_name,
            "email": email_to,
            "plan_name": plan_name,
            "amount": formatted_amount,
            "currency": currency_upper,
            "dashboard_link": dashboard_link,
            "created_date": created_date.strftime("%Y-%m-%d %H:%M:%S"),
            "expired_date": expired_date.strftime("%Y-%m-%d %H:%M:%S"),
            "support_email": config.SUPPORT_EMAIL,
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
