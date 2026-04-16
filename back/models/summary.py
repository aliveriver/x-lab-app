"""
models/summary.py — 摘要表（对话摘要，接口中的 abstractList）
"""
from sqlalchemy import BigInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Summary(Base):
    __tablename__ = "summaries"

    summary_id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="摘要UUID，接口映射为 abstractID")
    robot_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    # strategy: 'time' | 'round' | 'manual' | 'other'
    strategy: Mapped[str] = mapped_column(String(16), nullable=False, default="other")
    start_message_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    end_message_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    updated_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    deleted_at: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
