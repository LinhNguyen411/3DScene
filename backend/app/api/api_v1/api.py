from fastapi import APIRouter

from app.api.api_v1.endpoints import login, dev_tools, users, todos

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(
    dev_tools.router, prefix="/dev-tools", tags=["dev_tools"])
api_router.include_router(todos.router, prefix="/todos", tags=["todos"])
