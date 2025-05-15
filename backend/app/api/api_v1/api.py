from fastapi import APIRouter

from app.api.api_v1.endpoints import (
    login, users,  splats, feedbacks, payments, admin, public, payos, order)

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(splats.router, prefix="/splats", tags=["splats"])
api_router.include_router(feedbacks.router, prefix="/feedbacks", tags=["feedbacks"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(public.router, prefix="/public", tags=["public"])
# api_router.include_router(stripe.router, prefix="/stripe", tags=["stripe"])
api_router.include_router(payos.router, prefix="/payos", tags=["payos"])
api_router.include_router(order.router, prefix="/orders", tags=["orders"])

