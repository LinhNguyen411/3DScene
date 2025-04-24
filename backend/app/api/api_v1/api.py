from fastapi import APIRouter

from app.api.api_v1.endpoints import (
    login, dev_tools, users,  splats, feedbacks, stripe, payments, admin)

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(
    dev_tools.router, prefix="/dev-tools", tags=["dev_tools"])
api_router.include_router(splats.router, prefix="/splats", tags=["splats"])
api_router.include_router(feedbacks.router, prefix="/feedbacks", tags=["feedbacks"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(stripe.router, prefix="/stripe", tags=["stripe"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])


