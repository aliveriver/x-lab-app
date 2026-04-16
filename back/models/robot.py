"""
models/robot.py — 机器人表
"""
from sqlalchemy import BigInteger, String, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Robot(Base):
    __tablename__ = "robots"

    robot_id: Mapped[str] = mapped_column(String(64), primary_key=True, comment="机器人编码")
    robot_name: Mapped[str] = mapped_column(String(64), nullable=False, default="", comment="机器人默认名称")
    model: Mapped[str] = mapped_column(String(64), nullable=False, default="", comment="机器人型号")
    current_tone_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True, comment="当前音色ID")
    status: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1, comment="状态：1正常，2停用")
    created_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    updated_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    deleted_at: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
