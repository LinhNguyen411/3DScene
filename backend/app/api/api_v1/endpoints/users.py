from typing import Any, Optional

from sqlalchemy.orm import Session  # type: ignore
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi_pagination import Params, Page
from fastapi_pagination.ext.sqlalchemy import paginate
from pydantic.networks import EmailStr
from app import crud, models, schemas
from app.api import deps
from app.core.config import settings
from app.app_utils import send_new_account_email, generate_mail_confirmation_token, verify_mail_confirmation_token
from app.core.security import get_password_hash

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
    400: {"model": schemas.Detail, "description": "The user with this username already exists in the system"}})
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
    user_in = schemas.UserCreate(
        password=password, email=email, first_name=first_name, last_name=last_name)
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
        raise HTTPException(
            status_code=400, detail="User mail is already confirmed")
    user.is_active = True
    db.add(user)
    db.commit()
    return {"msg": "Mail confirmed"}


@router.get("/", response_model=Page[schemas.User], responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def read_users(
    params: Params = Depends(),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve items.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    users = crud.user.get_multi(db=db)

    return paginate(users, params)


@router.get("/{id}", response_model=schemas.User, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_user(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
) -> Any:
    """
    Delete an item.
    """
    user = crud.user.get(db=db, id=id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not current_user.is_superuser and (user.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return user


@router.post("/", response_model=schemas.User, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    user_in: schemas.UserCreate
) -> Any:
    """
    Create new item.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    user = crud.user.create(db=db, obj_in=user_in)
    return user


@router.put("/{id}", response_model=schemas.User, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
    user_in: schemas.UserUpdate,
) -> Any:
    """
    Update an item.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    user = crud.user.get(db=db, id=id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.id == id and (user_in.is_active == False or user_in.is_superuser == False):
        raise HTTPException(status_code=400, detail="Super users are not allowed to deactivate themselves")
    user = crud.user.update(db=db, db_obj=user, obj_in=user_in)
    return user


@router.delete("/{id}", response_model=schemas.User, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def delete_user(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
) -> Any:
    """
    Delete an item.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    user = crud.user.get(db=db, id=id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    user = crud.user.remove(db=db, id=id)
    return user
