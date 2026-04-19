"""
models/portrait.py — 用户画像表
"""
from sqlalchemy import BigInteger, String, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class UserPortrait(Base):
    __tablename__ = "user_portraits"

    portrait_id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="画像UUID，接口 portraitID")
    robot_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True, default="") # 用户UUID
    avatar: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    user_name: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    age: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    profession: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    education_level: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    family_ties: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    dialogue_style: Mapped[str | None] = mapped_column(Text, nullable=True)
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
