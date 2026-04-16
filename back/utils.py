"""
utils.py
公共工具函数：13 位时间戳、UUID、JWT 生成与校验
"""
import uuid
import time
from datetime import timedelta
from typing import Optional

from jose import jwt, JWTError

# ---- JWT 配置（生产环境应从环境变量读取） ----
SECRET_KEY = "x-lab-app-secret-key-please-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7


def now_ms() -> int:
    """返回当前 13 位毫秒时间戳"""
    return int(time.time() * 1000)


def new_uuid() -> str:
    """生成新的 UUID 字符串"""
    return str(uuid.uuid4())


def create_access_token(user_id: str) -> str:
    """
    生成 JWT token。
    payload 包含 sub（userID）和过期时间。
    """
    expire_ms = now_ms() + int(timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS).total_seconds() * 1000)
    payload = {
        "sub": user_id,
        "exp": expire_ms // 1000,  # jose 的 exp 是秒级时间戳
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    """
    解码 JWT token，返回 userID（sub 字段）。
    token 无效或过期时返回 None。
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None
