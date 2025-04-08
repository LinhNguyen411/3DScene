from google.auth.transport import requests
from google.oauth2 import id_token
from fastapi import Request
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session  # type: ignore

from app import crud
from app import models
from app import schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.core.security import get_password_hash
from app.app_utils import (
    generate_password_reset_token,
    send_reset_password_email,
    verify_password_reset_token,
)

router = APIRouter()


@router.post("/login/get-access-token", response_model=schemas.Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=400, detail="Incorrect email or password")
    elif not crud.user.is_active(user):
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/login/get-access-supertoken", response_model=schemas.Token)
def login_access_supertoken(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=400, detail="Incorrect email or password")
    elif not crud.user.is_active(user):
        raise HTTPException(status_code=400, detail="Inactive user")
    elif not crud.user.is_superuser(user):
        raise HTTPException(status_code=400, detail="User is not superuser")
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
}


@router.post("/login/verify-token", response_model=schemas.User, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def test_token(current_user: models.User = Depends(deps.get_current_active_user)) -> Any:
    """
    Test access token
    """
    return current_user

@router.post("/login/verify-supertoken", response_model=schemas.User, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def test_supertoken(current_user: models.User = Depends(deps.get_current_active_superuser)) -> Any:

    return current_user


@router.post("/login/password-recovery/{email}", response_model=schemas.Msg, responses={
    201: {"model": schemas.Detail, "description": "The user with this username does not exist in the system"},
})
def recover_password(email: str, db: Session = Depends(deps.get_db)) -> Any:
    """
    Password Recovery
    """
    user = crud.user.get_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=201,
            detail="20001",
        )
    password_reset_token = generate_password_reset_token(email=email)
    send_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )
    return {"msg": "Password recovery email sent"}


@router.post("/login/reset-password/", response_model=schemas.Msg, responses={
    400: {"model": schemas.Detail, "description": "Invalid token"},
    404: {"model": schemas.Detail, "description": "The user with this username does not exist in the system."},
})
def reset_password(
    token: str = Body(...),
    new_password: str = Body(...),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Reset password
    """
    email = verify_password_reset_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = crud.user.get_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    elif not crud.user.is_active(user):
        raise HTTPException(status_code=400, detail="Inactive user")
    hashed_password = get_password_hash(new_password)
    user.hashed_password = hashed_password
    db.add(user)
    db.commit()
    return {"msg": "Password updated successfully"}


config_data = {'GOOGLE_CLIENT_ID': settings.GOOGLE_AUTH_CLIENT_ID,
               'GOOGLE_CLIENT_SECRET': settings.GOOGLE_AUTH_CLIENT_SECRET}
starlette_config = Config(environ=config_data)
oauth = OAuth(starlette_config)
oauth.register(
    name='google',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)


@router.post('/login/google-auth', response_model=schemas.Token)
async def auth_credentials(
        credentials: str = Body(..., embed=True),
        db: Session = Depends(deps.get_db)):
    """Swap google token to app jwt token."""
    try:
        idinfo = id_token.verify_oauth2_token(
            credentials, requests.Request(), settings.GOOGLE_AUTH_CLIENT_ID)
    except Exception:
        raise HTTPException(
            status_code=400, detail="Incorrect google credentials.")
    user_email = idinfo['email']
    user = crud.user.get_by_email(db, email=user_email)
    if not user:
        raise HTTPException(
            status_code=400, detail="Incorrect email")
    elif not crud.user.is_active(user):
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }
