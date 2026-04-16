"""
schemas/common.py
统一响应体：{"code": 200, "data": {...}, "msg": "ok"}
"""
from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar("T")


class R(BaseModel, Generic[T]):
    """通用响应包装器"""
    code: int = 200
    data: Optional[T] = None
    msg: str = "ok"

    @classmethod
    def ok(cls, data: T = None, msg: str = "ok") -> "R[T]":
        return cls(code=200, data=data, msg=msg)

    @classmethod
    def fail(cls, code: int = 400, msg: str = "error") -> "R[None]":
        return cls(code=code, data=None, msg=msg)
