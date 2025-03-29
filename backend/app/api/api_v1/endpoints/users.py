from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic.networks import EmailStr
from sqlalchemy.orm import Session  # type: ignore
from app import crud, models, schemas
from app.api import deps
from app.core.config import settings
from app.app_utils import send_new_account_email, generate_mail_confirmation_token, verify_mail_confirmation_token

router = APIRouter()

@router.get("/get-my-info", response_model=schemas.User)
def read_user_me(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user information.
    """
    return current_user


@router.post("/signup", response_model=schemas.User, responses={
    400: {"model": schemas.Detail, "description": "The user with this username already exists in the system"},
    })
def create_user_signup(
    *,
    db: Session = Depends(deps.get_db),
    password: str = Body(...),
    email: EmailStr = Body(...),
    first_name: str = Body(...),
    last_name: str = Body(...),
) -> Any:
    """
    User sign up.
    """
    if not settings.USERS_OPEN_REGISTRATION:
        raise HTTPException(
            status_code=403,
            detail="Open user registration is forbidden on this server",
        )
    user = crud.user.get_by_email(db, email=email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    user_in = schemas.UserCreate(password=password, email=email, first_name=first_name, last_name=last_name)
    user = crud.user.create(db, obj_in=user_in)
    mail_confirmation_token = generate_mail_confirmation_token(email=email)
    if settings.EMAILS_ENABLED and user_in.email:
        send_new_account_email(
            email_to=user_in.email, token=mail_confirmation_token
        )
    return user


@router.post("/confirm-email/{token}", response_model=schemas.Msg)
def reset_password(
    *,
    db: Session = Depends(deps.get_db),
    token: str,
) -> Any:
    """
    Confirm email using token sent in email
    """
    email = verify_mail_confirmation_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = crud.user.get_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    elif crud.user.is_active(user):
        raise HTTPException(status_code=400, detail="User mail is already confirmed")
    user.is_active = True
    db.add(user)
    db.commit()
    return {"msg": "Mail confirmed"}