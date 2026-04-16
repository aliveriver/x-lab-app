"""
schemas/user.py
用户相关请求/响应 Pydantic 模型
"""
from typing import Optional
from pydantic import BaseModel, field_validator


# ---- 请求体 ----

class TokenRequest(BaseModel):
    """POST /api/user/token — 手机号+验证码登录注册"""
    phonenumber: str
    code: str

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("验证码必须为6位数字")
        return v


class BindRobotRequest(BaseModel):
    """POST /api/user/robot/bind"""
    userID: str
    robotID: str
    robotName: Optional[str] = None
    personalityID: Optional[int] = None
    toneID: Optional[int] = None


class UnbindRobotRequest(BaseModel):
    """DELETE /api/user/robot/unbind"""
    userID: str
    robotID: str


class ChangeRobotAliasRequest(BaseModel):
    """PUT /api/user/robot/alias"""
    userID: str
    robotID: str
    robotAlias: str


class ChangeRobotAliasRequest(BaseModel):
    """PUT /api/user/robot/alias"""
    userID: str
    robotID: str
    robotAlias: str


class ChangeUserInfoRequest(BaseModel):
    """PUT /api/user/{userID}/info/change"""
    phonenumber: Optional[str] = None
    userName: Optional[str] = None
    avatar: Optional[str] = None
    code: Optional[str] = None  # 验证码，开发阶段 mock 不校验


# ---- 响应 data 内容 ----

class TokenData(BaseModel):
    token: str
    userID: str
    isAdmin: int


class UserInfo(BaseModel):
    phonenumber: str
    userID: str
    userName: str
    avatar: str
    isAdmin: int


class RobotItem(BaseModel):
    robotCode: str
    robotName: str
    toneID: Optional[int] = None
    personalityID: Optional[int] = None


class UserRobotListData(BaseModel):
    robotList: list[RobotItem]
