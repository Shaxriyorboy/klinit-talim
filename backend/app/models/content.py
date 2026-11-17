"""O'quv kontenti: modul (protokol) → dars → savol.

Ko'p tilli matnlar JSONB da {"uz": ..., "ru": ...} ko'rinishida saqlanadi (kirill frontendda hosil qilinadi).
Manba (`source`) har bir savol va tushunchada majburiy: {"protocolId", "section", "page"}.
"""
from sqlalchemy import Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Module(Base, TimestampMixin):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    direction: Mapped[str] = mapped_column(String(80), default="akusherlik")
    section: Mapped[str] = mapped_column(String(80))
    order_no: Mapped[int] = mapped_column(Integer, default=0)
    title: Mapped[dict] = mapped_column(JSONB)
    short: Mapped[dict] = mapped_column(JSONB)
    protocol_id: Mapped[int] = mapped_column(Integer)
    standard_id: Mapped[int | None] = mapped_column(Integer)
    icd: Mapped[str] = mapped_column(String(255), default="")
    lead: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(20), default="soon")  # ready | soon
    # Takrorlash (FSRS) maqsadi: xavfli mavzularda yuqoriroq (masalan reanimatsiya 0.95)
    retention: Mapped[float] = mapped_column(Float, default=0.9, server_default="0.9")

    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="module", order_by="Lesson.order_no", cascade="all, delete-orphan"
    )


class Lesson(Base, TimestampMixin):
    __tablename__ = "lessons"
    __table_args__ = (UniqueConstraint("module_id", "slug"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"), index=True)
    slug: Mapped[str] = mapped_column(String(80))
    order_no: Mapped[int] = mapped_column(Integer, default=0)
    title: Mapped[dict] = mapped_column(JSONB)
    summary: Mapped[dict] = mapped_column(JSONB)
    minutes: Mapped[int] = mapped_column(Integer, default=5)
    scenes: Mapped[list] = mapped_column(JSONB, default=list)
    concepts: Mapped[list] = mapped_column(JSONB, default=list)

    module: Mapped[Module] = relationship(back_populates="lessons")
    questions: Mapped[list["Question"]] = relationship(
        back_populates="lesson", order_by="Question.order_no", cascade="all, delete-orphan"
    )


class Question(Base, TimestampMixin):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)  # masalan "p4-2"
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    order_no: Mapped[int] = mapped_column(Integer, default=0)
    type: Mapped[str] = mapped_column(String(10))  # single | multi | order
    prompt: Mapped[dict] = mapped_column(JSONB)
    case: Mapped[dict | None] = mapped_column(JSONB)
    options: Mapped[list] = mapped_column(JSONB)
    correct: Mapped[list] = mapped_column(JSONB)  # faqat serverda
    explanation: Mapped[dict] = mapped_column(JSONB)
    # Har bir variant uchun "nega to'g'ri/noto'g'ri" izohi: [{"uz","ru"} | null, ...] — variantlar bilan bir tartibda
    option_notes: Mapped[list | None] = mapped_column(JSONB)
    source: Mapped[dict] = mapped_column(JSONB)

    lesson: Mapped[Lesson] = relationship(back_populates="questions")
