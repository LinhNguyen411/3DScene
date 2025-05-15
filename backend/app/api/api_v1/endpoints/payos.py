from typing import Any
from sqlalchemy.orm import Session  # type: ignore
from app.api import deps
from app import schemas
from app import models
from app import crud

from fastapi import (APIRouter,  Depends, HTTPException, Request)
from core.config import Config,settings
import stripe
import json
from app.app_utils import send_subscription_success_email
from app.schemas import OrderCreate, OrderUpdate
from app import crud
from payos import PaymentData, ItemData, PayOS
import random
from pydantic import BaseModel

router = APIRouter()

class CheckoutSessionRequest(BaseModel):
    price: str

class OrderRequest(BaseModel):
    order_code: int

@router.post("/create-checkout-session", responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
async def create_checkout_session(
    *,
    config: Config = Depends(deps.get_config),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    request: CheckoutSessionRequest,
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
    price = int(request.price)
    payOS = PayOS(client_id=config.PAYOS_CLIENT_ID, api_key=config.PAYOS_API_KEY, checksum_key=config.PAYOS_CHECKSUM_KEY)
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    if crud.payment.check_is_last_payment_not_expired(db = db, payer_id=current_user.id):
        raise HTTPException(status_code=400, detail="This user already subscripted!")
    
    item = None
    if price == config.PAYOS_MONTHLY_PRICE:
        item = ItemData(name= "Thành viên tháng", quantity=1, price= price)
    elif price == config.PAYOS_YEARLY_PRICE:
        item = ItemData(name= "Thành viên năm", quantity=1, price= price)
    else:
        raise HTTPException(status_code=400, detail="Invalid price")

    try:
        orderCode = random.randint(1000, 999999)
        paymentData = PaymentData(orderCode=orderCode, 
                                  items=[item],
                                  amount=price, 
                                  description="demo",
                                  cancelUrl=settings.REACT_APP_DOMAIN + "/cancel",
                                  returnUrl=settings.REACT_APP_DOMAIN + "/success",
                                  )
        payosCreatePayment = payOS.createPaymentLink(paymentData)

        order_in = OrderCreate(
            id=orderCode,
            amount=price,
            status="PENDING"
        )
        order = crud.order.create_with_payer(db=db, obj_in=order_in, orderer_id=current_user.id)
        return payosCreatePayment.to_json()
    except Exception:
        raise HTTPException(status_code=403, detail="Error creating payment link")

@router.post("/confirm-payment")
async def confirm_payment(*,
                         config: Config = Depends(deps.get_config), 
                         db: Session = Depends(deps.get_db),
                         current_user: models.User = Depends(deps.get_current_active_user),
                         request:OrderRequest,
                         ) -> Any:
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
    orderId = request.order_code
    payOS = PayOS(client_id=config.PAYOS_CLIENT_ID, api_key=config.PAYOS_API_KEY, checksum_key=config.PAYOS_CHECKSUM_KEY)
    paymentLinkInfo = payOS.getPaymentLinkInformation(orderId = orderId)
    if paymentLinkInfo.status == "PAID":
        try:
            order = crud.order.get(db, id=orderId)
            if order is None:
                raise HTTPException(status_code=404, detail="Order not found")
            status = paymentLinkInfo.status
            order_in = OrderUpdate(
                status=status
            )            
            order = crud.order.update(db=db, db_obj=order, obj_in=order_in)
            existing_payment = crud.payment.get_by_order_id(db, order_id=orderId)
            if existing_payment:
                return order

            amount = int(paymentLinkInfo.amount)
            if amount == config.PAYOS_YEARLY_PRICE:
                payment_plan = "Yearly Membership"
            elif amount == config.PAYOS_MONTHLY_PRICE:
                payment_plan = "Monthly Membership"
            else:
                raise HTTPException(status_code=400, detail="Invalid price")
            payment_in = schemas.PaymentCreate(amount=float(amount),payment_plan=payment_plan, order_id=order.id)
            payment = crud.payment.create_with_payer(db = db, obj_in=payment_in, payer_id=current_user.id)
            send_subscription_success_email(email_to=current_user.email, user_name=current_user.last_name + " " + current_user.first_name, plan_name=payment_plan,amount=amount,currency="vnd", created_date=payment.created_at, expired_date=payment.expired_at)
        except Exception as e:
            raise HTTPException(status_code=400, detail="Error processing webhook data")
    else:
        raise HTTPException(status_code=400, detail="Payment not successful")

    return order

@router.post("/cancel-payment")
async def cancel_payment(*,
                         config: Config = Depends(deps.get_config), 
                         db: Session = Depends(deps.get_db),
                         current_user: models.User = Depends(deps.get_current_active_user),
                         request:OrderRequest,
                         ) -> Any:
    orderId = request.order_code
    if not current_user.is_active: 
        raise HTTPException(status_code=400, detail="Not enough permissions")
    payOS = PayOS(client_id=config.PAYOS_CLIENT_ID, api_key=config.PAYOS_API_KEY, checksum_key=config.PAYOS_CHECKSUM_KEY)
    paymentLinkInfo = payOS.getPaymentLinkInformation(orderId = orderId)
    if paymentLinkInfo.status == "CANCELLED":
        try:
            order = crud.order.get(db, id=orderId)
            if order is None:
                raise HTTPException(status_code=404, detail="Order not found")
            status = paymentLinkInfo.status
            order_in = OrderUpdate(
                status=status
            )            
            order = crud.order.update(db=db, db_obj=order, obj_in=order_in)

        except Exception as e:
            raise HTTPException(status_code=400, detail="Error processing webhook data")
    else:
        raise HTTPException(status_code=400, detail="Payment not successful")

    return order
