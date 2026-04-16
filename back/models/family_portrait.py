"""
models/family_portrait.py — 家庭画像表
"""
from sqlalchemy import BigInteger, String, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class FamilyPortrait(Base):
    __tablename__ = "family_portraits"

    family_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    robot_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_current: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1, comment="1=当前画像")
    created_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    updated_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    deleted_at: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
