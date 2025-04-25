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
from core.config import settings, Config
import stripe
import json
from app.app_utils import send_subscription_success_email



router = APIRouter()

@router.post("/create-checkout-session", response_model=schemas.CheckoutSessionReponse, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
async def create_checkout_session(
    *,
    config: Config = Depends(deps.get_config),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    request:schemas.CheckoutSessionRequest,
) -> Any:
    """
    Tạo phiên thanh toán Stripe cho người dùng.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Body):**
    - `priceId` (str, bắt buộc): ID của gói thanh toán mà người dùng chọn.

    **Đầu ra (Response):**
    - 200 OK: Trả về ID của phiên thanh toán (`sessionId`) nếu tạo thành công.
    - 400 Bad Request: Nếu người dùng không đủ quyền hoặc đã đăng ký gói thanh toán.
    - 401 Unauthorized: Nếu người dùng chưa đăng nhập hoặc token không hợp lệ.
    """
    stripe.api_key = config.STRIPE_API_KEY
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    if crud.payment.check_is_last_payment_not_expired(db = db, payer_id=current_user.id):
        raise HTTPException(status_code=400, detail="This user already subscripted!")
    checkout_session = stripe.checkout.Session.create(
        success_url=config.SERVER_HOST_FRONT + "/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=config.SERVER_HOST_FRONT + "/cancel",
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{
            "price": request.priceId,
            "quantity": 1
        }],
        metadata={
            "user_id": current_user.id,
            "payment_plan": "Yearly Membership" if request.priceId == config.STRIPE_YEARLY_ID else "Monthly Membership"
        }
    )
    return {"sessionId": checkout_session["id"]}

@router.post("/webhook")
async def stripe_webhook(request: Request,config: Config = Depends(deps.get_config), db: Session = Depends(deps.get_db)):
    """
    Nhận và xử lý webhook từ Stripe khi một phiên thanh toán hoàn thành.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Body):**
    - Dữ liệu webhook từ Stripe được gửi dưới dạng JSON. Payload chứa thông tin sự kiện thanh toán hoàn thành (ví dụ: checkout.session.completed).

    **Đầu ra (Response):**
    - 200 OK: Trả về thông báo "success" nếu webhook được xử lý thành công.
    - 400 Bad Request: Nếu có lỗi khi xử lý sự kiện webhook hoặc dữ liệu không hợp lệ từ Stripe.

    **Giải thích:**
    - Webhook nhận sự kiện từ Stripe khi một phiên thanh toán hoàn thành, bao gồm thông tin về số tiền thanh toán, kế hoạch thanh toán, và người dùng.
    - Sau khi xác thực sự kiện, nó sẽ lưu thông tin thanh toán vào cơ sở dữ liệu và gửi email thông báo cho người dùng về việc đăng ký thành công.
    """
    stripe.api_key = config.STRIPE_API_KEY
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