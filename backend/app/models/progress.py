"""O'quvchi faoliyati: mashq sessiyalari, javoblar, dars natijalari, yakuniy testlar."""
import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PracticeSession(Base):
    """Bitta darsning mashq bosqichi. Hamma savolga to'g'ri javob berilganda yakunlanadi."""

    __tablename__ = "practice_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    first_try: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class TestAttempt(Base):
    __tablename__ = "test_attempts"
    __test__ = False  # pytest buni test klassi deb o'ylamasin

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(8), default="final", server_default="final")  # pre | final
    question_ids: Mapped[list] = mapped_column(JSONB)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    score_pct: Mapped[int | None] = mapped_column(Integer)
    passed: Mapped[bool | None] = mapped_column(Boolean)


class QuestionAttempt(Base):
    """Har bir javob — tahlil (eng qiyin savollar) va kelajakda spaced repetition uchun."""

    __tablename__ = "question_attempts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    question_id: Mapped[str] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), index=True)
    practice_session_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("practice_sessions.id", ondelete="CASCADE"), index=True
    )
    test_attempt_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("test_attempts.id", ondelete="CASCADE"), index=True)
    context: Mapped[str] = mapped_column(String(10))  # practice | test | pretest | review
    answer: Mapped[list] = mapped_column(JSONB)
    is_correct: Mapped[bool] = mapped_column(Boolean)
    # O'quvchining ishonchi: sure (aniq bilaman) | unsure (taxminan) | guess (bilmayman). "sure" + xato = xavfli
    confidence: Mapped[str | None] = mapped_column(String(8))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ModuleVideoView(Base):
    """Mavzu videosi oxirigacha ko'rilgan — birinchi dars shundan keyin ochiladi."""

    __tablename__ = "module_video_views"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"), primary_key=True)
    watched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), primary_key=True)
    first_try: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ReviewCard(Base):
    """Takrorlash kartochkasi (FSRS): har bir o'quvchi × savol uchun keyingi takrorlash vaqti."""

    __tablename__ = "review_cards"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    question_id: Mapped[str] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), primary_key=True)
    card: Mapped[dict] = mapped_column(JSONB)  # fsrs.Card.to_dict()
    due: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    reps: Mapped[int] = mapped_column(Integer, default=0)
    lapses: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
