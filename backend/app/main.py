from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from starlette.middleware.cors import CORSMiddleware

from app.api.api_v1.api import api_router
from app.core.config import settings
from app.db.session import SessionLocal
from app.db.init_db import init_db
import os
from fastapi.openapi.docs import get_swagger_ui_html
from starlette.requests import Request

    # Check if .backend.env exists, create it if not
backend_env_path = "/code/app/core/.backend.env"
if not os.path.exists(backend_env_path):
    with open(backend_env_path, "w") as env_file:
        env_file.write("""
STRIPE_API_KEY=""
STRIPE_PUBLIC_KEY=""
STRIPE_MONTHLY_ID=""
STRIPE_YEARLY_ID=""

GOOGLE_AUTH_CLIENT_ID=""
GOOGLE_AUTH_CLIENT_SECRET=""

SMTP_USER=""
SMTP_PASSWORD=""
EMAILS_FROM_EMAIL=""
SUPPORT_EMAIL=""

PROJECT_NAME="3DScene"
PROJECT_DESCRIPTION="Transform videos into stunning 3D scenes with AI-powered Gaussian Splatting! Our app uses cutting-edge technology to automatically reconstruct high-quality 3D models from simple videos — fast, easy, and perfect for gaming, VR, and digital content creation."
PROJECT_KEYWORDS="3D asset generation from video, 3D Gaussian splatting from video, 3D Gaussian splatting software, 3D model creation AI, 3D reconstruction from video, 3D scene generation AI, AI 3D model creation, AI 3D scene reconstruction, automatic 3D reconstruction, Gaussian splatting 3D models, machine learning 3D reconstruction, NeRF alternative Gaussian splatting, real-time 3D Gaussian splatting, turn videos into 3D scenes, video-based 3D modeling, video to 3D model generator"
PROJECT_ICON="/public/logo.png"
                       
PAYOS_CLIENT_ID=""
PAYOS_API_KEY=""
PAYOS_CHECKSUM_KEY=""
PAYOS_MONTHLY_PRICE=2000
PAYOS_YEARLY_PRICE=2000

            """)

app = FastAPI(
    title=settings.PROJECT_NAME
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
os.makedirs(settings.MODEL_IMAGES_DIR, exist_ok=True)
os.makedirs(settings.PUBLIC_DIR, exist_ok=True)
app.mount(f"{settings.API_V1_STR}/thumbnails", StaticFiles(directory=settings.MODEL_THUMBNAILS_DIR), name="thumbnails")
app.mount(f"{settings.API_V1_STR}/images", StaticFiles(directory=settings.MODEL_IMAGES_DIR), name="images")
app.mount(f"{settings.API_V1_STR}/public", StaticFiles(directory=settings.PUBLIC_DIR), name="public")

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html(req: Request):
    root_path = req.scope.get("root_path", "").rstrip("/")
    openapi_url = root_path + app.openapi_url
    return get_swagger_ui_html(
        openapi_url=openapi_url,
        title="API",
    )

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
