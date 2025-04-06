from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from starlette.middleware.cors import CORSMiddleware
# from starlette.middleware.sessions import SessionMiddleware
# from fastapi.middleware.cors import CORSMiddleware

from app.api.api_v1.api import api_router
from app.core.config import settings
from app.db.session import SessionLocal
from app.db.init_db import init_db
import os

app = FastAPI(
    title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)


# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


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

os.makedirs(settings.SPLAT_THUMBNAILS_DIR, exist_ok=True)
app.mount("/thumbnails", StaticFiles(directory=settings.SPLAT_THUMBNAILS_DIR), name="thumbnails")



@app.get("/")
async def root():

    return {"message": "Hello World"}
