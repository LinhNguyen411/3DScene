from typing import Any
from sqlalchemy.orm import Session  # type: ignore
from app.api import deps
from app import schemas
from app import models
from app import crud

from fastapi_pagination.ext.sqlalchemy import paginate
from fastapi_pagination import Params, Page
from fastapi import (APIRouter,  Depends, HTTPException, Request)
import os
from core.config import settings
import stripe
import json
from app.app_utils import send_subscription_success_email


stripe.api_key = settings.STRIPE_API_KEY


router = APIRouter()

@router.post("/create-checkout-session", response_model=schemas.CheckoutSessionReponse, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
async def create_checkout_session(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    request:schemas.CheckoutSessionRequest,
) -> Any:
    """
    Create new item.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    if crud.payment.check_is_last_payment_not_expired(db = db, payer_id=current_user.id):
        raise HTTPException(status_code=400, detail="This user already subscripted!")
    checkout_session = stripe.checkout.Session.create(
        success_url=settings.FRONTEND_DOMAIN + "/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=settings.FRONTEND_DOMAIN + "/cancel",
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{
            "price": request.priceId,
            "quantity": 1
        }],
        metadata={
            "user_id": current_user.id,
            "payment_plan": "Yealy Membership" if request.priceId == settings.YEARLY_ID else "Monthly Membership"
        }
    )
    return {"sessionId": checkout_session["id"]}

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(deps.get_db)):
    payload = await request.body()
    event = None

    try:
        event = stripe.Event.construct_from(
            json.loads(payload), stripe.api_key
        )
    except ValueError as e:
        return HTTPException(status=400)

    # Handle Stripe event
    if event["type"] == "checkout.session.completed":
        try:
            data = event["data"]["object"]
            amount = float(data["amount_total"]) / 100
            user_id = data["metadata"].get("user_id", 0)
            payment_plan = data["metadata"].get("payment_plan", "month")
            payment_in = schemas.PaymentCreate(amount=amount,payment_plan=payment_plan)
            payment = crud.payment.create_with_payer(db = db, obj_in=payment_in, payer_id=user_id)
            user: schemas.User = crud.user.get(db, id=user_id)
            send_subscription_success_email(email_to=user.email, user_name=user.last_name + user.first_name, plan_name=payment_plan,amount=amount,currency="usd", created_date=payment.created_at, expired_date=payment.expired_at)
        except Exception as e:
            raise HTTPException(status_code=400, detail="Error processing webhook data")
    return {"status": "success"}