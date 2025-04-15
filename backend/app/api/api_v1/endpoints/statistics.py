from typing import Any, Optional
from sqlalchemy.orm import Session  # type: ignore
from app.api import deps
from app import schemas
from app import models
from app import crud
from app.celery import celery_app
from celery.result import AsyncResult

from fastapi_pagination.ext.sqlalchemy import paginate
from fastapi_pagination import Params, Page
from fastapi import (APIRouter,  Depends, HTTPException,
                     File, UploadFile, Form)
from fastapi.responses import FileResponse
import os
import uuid
from app.core.config import settings
import shutil
import cv2



router = APIRouter()

@router.get("/total-pro-users", responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_total_pro_users(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    total = crud.payment.count_pro_users(db=db)
    return total

@router.get("/total-users", responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_total_pro_users(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    total = crud.user.get_total_users(db=db)
    return total

@router.get("/get-splats-last-24hours", responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_splats_last_24hours(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    splats = crud.splat.get_splats_last_24_hours(db=db)
    return splats

@router.get("/total-amount", responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_total_amount(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    total_amount = crud.payment.get_total_amount(db)
    return total_amount