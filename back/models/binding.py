"""
models/binding.py — 用户机器人绑定表
"""
from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class UserRobotBinding(Base):
    __tablename__ = "user_robot_bindings"

    binding_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    robot_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    robot_alias: Mapped[str] = mapped_column(String(64), nullable=False, default="", comment="用户给机器人的昵称")
    init_personality_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    bind_tone_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    updated_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    deleted_at: Mapped[int | None] = mapped_column(BigInteger, nullable=True, comment="解绑时间，NULL表示仍绑定")
