"""
models/user.py — 用户表
"""
from sqlalchemy import BigInteger, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="用户UUID")
    phone_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, comment="手机号")
    user_name: Mapped[str] = mapped_column(String(64), nullable=False, default="", comment="用户名")
    avatar: Mapped[str] = mapped_column(String(512), nullable=False, default="", comment="用户头像路径")
    is_admin: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0, comment="是否管理员：0普通用户，1管理员")
    created_at: Mapped[int] = mapped_column(BigInteger, nullable=False, comment="创建时间13位时间戳")
    updated_at: Mapped[int] = mapped_column(BigInteger, nullable=False, comment="更新时间13位时间戳")
    deleted_at: Mapped[int | None] = mapped_column(BigInteger, nullable=True, comment="删除时间，NULL表示未删除")
