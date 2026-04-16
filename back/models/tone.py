"""
models/tone.py — 音色表
"""
from sqlalchemy import BigInteger, Integer, String, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Tone(Base):
    __tablename__ = "tones"

    tone_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tone_name: Mapped[str] = mapped_column(String(64), nullable=False)
    provider: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    voice_code: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    demo_url: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    enabled: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    created_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    updated_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    deleted_at: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
