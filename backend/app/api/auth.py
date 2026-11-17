from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from app.core.config import settings
from app.core.deps import CurrentUser, DbDep
from app.core.security import create_access_token, hash_password, normalize_phone, verify_password
from app.models import Institution, User
from app.schemas.auth import AuthOut, InstitutionOut, LoginIn, RegisterIn, UserOut
from app.services.learning import level_of

router = APIRouter(tags=["auth"])


def user_out(u: User) -> UserOut:
    return UserOut(
        id=u.id,
        phone=u.phone,
        full_name=u.full_name,
        role=u.role,
        institution=InstitutionOut.model_validate(u.institution) if u.institution else None,
        department=u.department,
        position=u.position,
        xp=u.xp,
        level=level_of(u.xp),
    )


def _set_cookie(resp: Response, token: str) -> None:
    resp.set_cookie(
        settings.cookie_name,
        token,
        max_age=settings.jwt_expire_days * 86400,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path="/",
    )


@router.get("/institutions", response_model=list[InstitutionOut])
async def institutions(db: DbDep):
    rows = await db.execute(select(Institution).order_by(Institution.region, Institution.name))
    return rows.scalars().all()


@router.post("/auth/register", response_model=AuthOut, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterIn, db: DbDep, response: Response):
    phone = normalize_phone(body.phone)
    if not phone:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Telefon raqami noto'g'ri")
    exists = await db.scalar(select(User.id).where(User.phone == phone))
    if exists:
        raise HTTPException(status.HTTP_409_CONFLICT, "Bu raqam bilan foydalanuvchi mavjud")
    if body.institution_id is not None and await db.get(Institution, body.institution_id) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Muassasa topilmadi")
    user = User(
        phone=phone,
        full_name=body.full_name.strip(),
        password_hash=hash_password(body.password),
        institution_id=body.institution_id,
        department=body.department.strip(),
        position=body.position.strip(),
    )
    db.add(user)
    await db.commit()
    user = await db.get(User, user.id, populate_existing=True)
    token = create_access_token(user.id)
    _set_cookie(response, token)
    return AuthOut(user=user_out(user), access_token=token)


@router.post("/auth/login", response_model=AuthOut)
async def login(body: LoginIn, db: DbDep, response: Response):
    phone = normalize_phone(body.phone)
    user = await db.scalar(select(User).where(User.phone == phone)) if phone else None
    if user is None or not user.is_active or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Telefon yoki parol noto'g'ri")
    token = create_access_token(user.id)
    _set_cookie(response, token)
    return AuthOut(user=user_out(user), access_token=token)


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    response.delete_cookie(settings.cookie_name, path="/")


@router.get("/auth/me", response_model=UserOut)
async def me(user: CurrentUser):
    return user_out(user)
