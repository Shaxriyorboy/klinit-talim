import enum

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Role(str, enum.Enum):
    learner = "learner"  # tibbiy xodim
    inspector = "inspector"  # Klinik audit inspeksiyasi
    admin = "admin"


class Institution(Base, TimestampMixin):
    """Tibbiy muassasa (tug'ruq kompleksi, perinatal markaz va h.k.)."""

    __tablename__ = "institutions"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True)
    region: Mapped[str] = mapped_column(String(120), default="")


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role, name="user_role"), default=Role.learner)
    institution_id: Mapped[int | None] = mapped_column(ForeignKey("institutions.id", ondelete="SET NULL"), index=True)
    department: Mapped[str] = mapped_column(String(255), default="")
    position: Mapped[str] = mapped_column(String(120), default="")
    xp: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)

    institution: Mapped[Institution | None] = relationship(lazy="joined")
