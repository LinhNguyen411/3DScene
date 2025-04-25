from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from starlette.middleware.cors import CORSMiddleware

from app.api.api_v1.api import api_router
from app.core.config import settings
from app.db.session import SessionLocal
from app.db.init_db import init_db
import os

app = FastAPI(
    title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json"
)
@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    init_db(db)


# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin)
                       for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

os.makedirs(settings.MODEL_ASSETS_DIR, exist_ok=True)
os.makedirs(settings.MODEL_THUMBNAILS_DIR, exist_ok=True)
os.makedirs(settings.MODEL_WORKSPACES_DIR, exist_ok=True)
app.mount("/thumbnails", StaticFiles(directory=settings.MODEL_THUMBNAILS_DIR), name="thumbnails")



@app.get("/")
async def root():
    """
    Root endpoint for the application.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông điệp "Hello World".

    **Giải thích:**
    - Đây là điểm cuối gốc của ứng dụng, trả về một thông điệp chào mừng đơn giản khi truy cập vào URL gốc ("/").
    """
    return {"message": "Hello World"}
