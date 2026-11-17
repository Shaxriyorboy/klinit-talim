"""Testlar alohida bazada (TEST_DATABASE_URL) ishlaydi; kontent bir marta yuklanadi."""
import asyncio

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.database import get_db
from app.core.security import hash_password
from app.main import app
from app.models import Base, Role, User
from app.services.content_loader import sync_content


def _engine():
    return create_async_engine(settings.test_database_url, poolclass=NullPool)


@pytest.fixture(scope="session", autouse=True)
def _schema():
    async def setup():
        eng = _engine()
        async with eng.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.execute(text("DROP TYPE IF EXISTS user_role"))
            await conn.run_sync(Base.metadata.create_all)
        async with async_sessionmaker(eng, expire_on_commit=False)() as db:
            await sync_content(db, settings.content_path)
        await eng.dispose()

    asyncio.run(setup())


@pytest.fixture
async def db():
    eng = _engine()
    # har bir testdan oldin foydalanuvchi ma'lumotlarini tozalash (kontent qoladi)
    async with eng.begin() as conn:
        await conn.execute(
            text("TRUNCATE review_cards, question_attempts, lesson_progress, module_video_views, practice_sessions, test_attempts, users, institutions RESTART IDENTITY CASCADE")
        )
    maker = async_sessionmaker(eng, class_=AsyncSession, expire_on_commit=False)

    async def _get_db():
        async with maker() as s:
            yield s

    app.dependency_overrides[get_db] = _get_db
    async with maker() as s:
        yield s
    app.dependency_overrides.clear()
    await eng.dispose()


@pytest.fixture
async def client(db):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def register(client, phone="+998901112233", password="parol123", name="Malika Karimova"):
    r = await client.post("/api/v1/auth/register", json={"phone": phone, "password": password, "full_name": name})
    assert r.status_code == 201, r.text
    return r.json()


@pytest.fixture
async def learner(client):
    return await register(client)


@pytest.fixture
async def inspector_client(db):
    db.add(User(phone="+998900000009", full_name="Inspektor", password_hash=hash_password("inspektor1"), role=Role.inspector))
    await db.commit()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.post("/api/v1/auth/login", json={"phone": "+998900000009", "password": "inspektor1"})
        assert r.status_code == 200
        yield c
