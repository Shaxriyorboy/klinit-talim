from fastapi import APIRouter

from app.api import auth, content, learning, reports

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(content.router)
api_router.include_router(learning.router)
api_router.include_router(reports.router)
