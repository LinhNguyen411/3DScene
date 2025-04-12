from typing import Any
from sqlalchemy.orm import Session  # type: ignore
from app.api import deps
from app import schemas
from app import models
from app import crud

from fastapi_pagination.ext.sqlalchemy import paginate
from fastapi_pagination import Params, Page
from fastapi import (APIRouter,  Depends, HTTPException)



router = APIRouter()


@router.get("/", response_model=Page[schemas.Payment], responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def read_payments(
    params: Params = Depends(),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve items.
    """

    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    if current_user.is_superuser:
        payments = crud.payment.get_multi(db=db)
    else:
        payments = crud.payment.query_get_multi_by_payer(db=db, payer_id=current_user.id)

    return paginate(payments, params)

@router.get("/{id}", response_model=schemas.Payment, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_payment(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
) -> Any:
    """
    Delete an item.
    """
    payment = crud.payment.get(db=db, id=id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return payment


@router.post("/", response_model=schemas.Payment, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
async def create_payment(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    user_id : int,
    payment_in: schemas.PaymentCreate
) -> Any:
    """
    Create new item.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    payment: models.Payment = crud.payment.create_with_payer(
        db, obj_in=payment_in, payer_id=user_id)
    return payment


@router.put("/{id}", response_model=schemas.Payment, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def update_payment(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
    payment_in: schemas.PaymentUpdate,
) -> Any:
    """
    Update an item.
    """
    payment = crud.payment.get(db=db, id=id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    payment = crud.payment.update(db=db, db_obj=payment, obj_in=payment_in)
    return payment


@router.delete("/{id}", response_model=schemas.Detail, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def delete_payment(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
) -> Any:
    """
    Delete an item.
    """
    payment = crud.payment.get(db=db, id=id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    payment = crud.payment.remove(db=db, id=id)
    return {"detail": f'Payment deleted successfully {id}'}
