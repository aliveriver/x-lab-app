"""
models/skill.py — 技能表 & 机器人技能表
"""
from sqlalchemy import BigInteger, Integer, String, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Skill(Base):
    """系统技能列表"""
    __tablename__ = "skills"

    skill_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    skill_name: Mapped[str] = mapped_column(String(64), nullable=False)
    skill_type: Mapped[str] = mapped_column(String(16), nullable=False, default="llm")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    enabled: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    created_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    updated_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    deleted_at: Mapped[int | None] = mapped_column(BigInteger, nullable=True)


class RobotSkill(Base):
    """机器人已启用的技能"""
    __tablename__ = "robot_skills"

    robot_skill_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    robot_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    skill_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    enabled: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    created_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    updated_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    deleted_at: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
