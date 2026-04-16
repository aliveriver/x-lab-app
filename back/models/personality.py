"""
models/personality.py — 初始人格预设表 & 机器人人格记录表
"""
from sqlalchemy import BigInteger, Integer, String, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class PersonalityPreset(Base):
    """系统预设初始人格，对应"获取全部机器人初始人格"接口"""
    __tablename__ = "personality_presets"

    personality_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    personality_name: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # MBTI 各维度，0-100，两两求和 = 100
    mbti_e: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    mbti_i: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    mbti_s: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    mbti_n: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    mbti_t: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    mbti_f: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    mbti_j: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    mbti_p: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    # 大五人格
    big5_neuroticism: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    big5_extraversion: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    big5_openness: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    big5_agreeableness: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    big5_conscientiousness: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    enabled: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    created_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    updated_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    deleted_at: Mapped[int | None] = mapped_column(BigInteger, nullable=True)


class RobotPersonalityRecord(Base):
    """机器人人格记录，支持动态人格和历史追踪"""
    __tablename__ = "robot_personality_records"

    personality_record_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    robot_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    # source: 'preset' | 'manual' | 'analysis'
    source: Mapped[str] = mapped_column(String(16), nullable=False, default="manual")
    preset_personality_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    is_current: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1, comment="1=当前人格")
    # MBTI
    mbti_e: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    mbti_i: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    mbti_s: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    mbti_n: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    mbti_t: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    mbti_f: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    mbti_j: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    mbti_p: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    # 大五人格
    big5_neuroticism: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    big5_extraversion: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    big5_openness: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    big5_agreeableness: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    big5_conscientiousness: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=50)
    created_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    updated_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    deleted_at: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
