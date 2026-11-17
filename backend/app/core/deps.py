"""Umumiy dependency'lar — joriy foydalanuvchini aniqlash (cookie yoki Bearer)."""
from typing import Annotated

from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import Role, User

DbDep = Annotated[AsyncSession, Depends(get_db)]


def _token(authorization: str | None, cookie: str | None) -> str | None:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1]
    return cookie


async def get_current_user(
    db: DbDep,
    authorization: Annotated[str | None, Header()] = None,
    pa_token: Annotated[str | None, Cookie(alias=settings.cookie_name)] = None,
) -> User:
    token = _token(authorization, pa_token)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Tizimga kirilmagan")
    user_id = decode_token(token)
    if user_id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token yaroqsiz")
    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Foydalanuvchi topilmadi")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_inspector(user: CurrentUser) -> User:
    if user.role not in (Role.inspector, Role.admin):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Faqat inspektor yoki administrator uchun")
    return user


InspectorUser = Annotated[User, Depends(require_inspector)]
