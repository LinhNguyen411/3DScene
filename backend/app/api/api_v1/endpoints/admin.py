from typing import Any, Optional, List,Dict
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
from app.core.config import settings, Config
import shutil
import cv2
from pydantic import BaseModel
from dotenv import load_dotenv, set_key

statistic_router = APIRouter()

@statistic_router.get("/total-pro-users", responses={
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

@statistic_router.get("/total-users", responses={
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

@statistic_router.get("/get-splats-last-24hours", responses={
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

@statistic_router.get("/total-amount", responses={
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

config_router = APIRouter()

router = APIRouter()

class EnvVariableResponse(BaseModel):
    key: str
    value: str
    sensitive: bool

class EnvVariableUpdate(BaseModel):
    key: str
    value: str


@config_router.get("/env", response_model=List[EnvVariableResponse], responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"},
    403: {"model": schemas.Detail, "description": "Not enough permissions"}
})
async def get_environment_variables(
    *,
    config: Config = Depends(deps.get_config),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all environment variables.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    
    # Define sensitive keys that should be masked
    sensitive_keys = [
        "SMTP_PASSWORD", 
        "GOOGLE_AUTH_CLIENT_SECRET", 
        "STRIPE_API_KEY"
    ]
    
    env_vars = []
    
    # Add environment vars from config
    for key in dir(config):
        if not key.startswith("_") and key.isupper():
            value = getattr(config, key)
            if isinstance(value, (str, int, bool, float)) or value is None:
                is_sensitive = key in sensitive_keys
                display_value = "****" if is_sensitive else str(value)
                env_vars.append({
                    "key": key,
                    "value": display_value,
                    "sensitive": is_sensitive
                })
    
    return env_vars

@config_router.put("/env", response_model=Dict[str, str], responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"},
    403: {"model": schemas.Detail, "description": "Not enough permissions"},
    400: {"model": schemas.Detail, "description": "Invalid environment variable"}
})
async def update_environment_variable(
    *,
    config: Config = Depends(deps.get_config),
    current_user: models.User = Depends(deps.get_current_active_user),
    env_update: EnvVariableUpdate,
) -> Any:
    """
    Update an environment variable in .backend.env file.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    
    # Validate that the variable exists in the config
    valid_config_keys = [key for key in dir(config) if not key.startswith("_") and key.isupper()]
    if env_update.key not in valid_config_keys:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid environment variable: {env_update.key}"
        )
    
    # Update the .backend.env file - using direct file manipulation
    env_file = "/code/app/core/.backend.env"
    
    try:
        # Read all lines from the .env file
        with open(env_file, 'r') as file:
            lines = file.readlines()
        
        # Check if the key already exists in the file
        key_exists = False
        for i, line in enumerate(lines):
            if line.strip() and not line.strip().startswith('#'):
                key_value = line.strip().split('=', 1)
                if len(key_value) == 2 and key_value[0].strip() == env_update.key:
                    # Update the existing key
                    lines[i] = f'{env_update.key}="{env_update.value}"\n'
                    key_exists = True
                    break
        
        # If key doesn't exist, add it to the end of the file
        if not key_exists:
            lines.append(f"{env_update.key}={env_update.value}\n")
        
        # Write the updated content back to the file
        with open(env_file, 'w') as file:
            file.writelines(lines)
        
        # Update the current environment
        os.environ[env_update.key] = env_update.value
        
        # Reload dotenv file
        load_dotenv(dotenv_path=env_file, override=True)
        
        return {"message": f"Environment variable {env_update.key} updated successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update environment variable: {str(e)}"
        )

@config_router.get("/env/reload", response_model=Dict[str, str], responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"},
    403: {"model": schemas.Detail, "description": "Not enough permissions"}
})
async def reload_environment_variables(
    *,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Reload all environment variables from .backend.env file.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    
    try:
        load_dotenv(dotenv_path="/code/app/core/.backend.env", override=True)
        return {"message": "Environment variables reloaded successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reload environment variables: {str(e)}"
        )


@config_router.post("/create-env-backup", response_model=Dict[str, str], responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"},
    403: {"model": schemas.Detail, "description": "Not enough permissions"}
})
async def create_env_backup(
    *,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a backup of the current .backend.env file.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    
    from datetime import datetime
    import shutil
    
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        source = "/code/app/core/.backend.env"
        destination = f"/code/app/core/.backend.env.backup_{timestamp}"
        
        shutil.copy2(source, destination)
        
        return {"message": f"Environment file backed up to {destination}"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create backup: {str(e)}"
        )

router = APIRouter()
router.include_router(statistic_router, prefix="/statistic", tags=["statistic"])
router.include_router(config_router, prefix="/config", tags=["config"])
