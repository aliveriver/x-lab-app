"""
schemas/robot.py
机器人相关请求/响应 Pydantic 模型
"""
from typing import Optional
from pydantic import BaseModel, model_validator


# ---- 人格相关 ----

class MBTIData(BaseModel):
    E: int
    I: int
    S: int
    N: int
    T: int
    F: int
    J: int
    P: int

    @model_validator(mode="after")
    def check_mbti_pairs(self) -> "MBTIData":
        """验证 MBTI 每对维度之和为 100"""
        assert self.E + self.I == 100, "E+I 必须等于 100"
        assert self.S + self.N == 100, "S+N 必须等于 100"
        assert self.T + self.F == 100, "T+F 必须等于 100"
        assert self.J + self.P == 100, "J+P 必须等于 100"
        return self


class Big5Data(BaseModel):
    neuroticism: int      # 神经质
    extraversion: int     # 外倾性
    openness: int         # 开放性
    agreeableness: int    # 宜人性
    conscientiousness: int  # 尽责性


class PersonalityData(BaseModel):
    mbti: MBTIData
    big5: Big5Data


class ChangePersonalityRequest(BaseModel):
    """PUT /api/robot/{robotID}/personality/change"""
    robotID: str
    mbti: MBTIData
    big5: Big5Data


# ---- 音色相关 ----

class ChangeToneRequest(BaseModel):
    """PUT /api/robot/{robotID}/tone/change"""
    robotID: str
    toneID: int


class ToneItem(BaseModel):
    toneID: int
    toneName: str


class ToneListData(BaseModel):
    toneList: list[ToneItem]


# ---- 初始人格列表 ----

class PersonalityPresetItem(BaseModel):
    personalityID: int
    personalityName: str


class PersonalityListData(BaseModel):
    personalityList: list[PersonalityPresetItem]


# ---- 技能列表 ----

class SkillItem(BaseModel):
    skillID: int
    skillName: str


class SkillListData(BaseModel):
    skillList: list[SkillItem]


# ---- 消息分页 ----

class MessageItem(BaseModel):
    messageID: str
    createdAt: int
    content: str
    belong: str


class PageMeta(BaseModel):
    nextCursor: str
    hasMore: bool


class MessageListData(BaseModel):
    messageList: list[MessageItem]
    meta: PageMeta


# ---- 摘要分页 ----

class AbstractItem(BaseModel):
    abstractID: str
    createdAt: int
    content: str


class AbstractListData(BaseModel):
    abstractList: list[AbstractItem]
    meta: PageMeta


# ---- 用户画像 ----

class UserPortraitItem(BaseModel):
    portraitID: str
    avatar: str


class UserPortraitListData(BaseModel):
    userPortraitList: list[UserPortraitItem]


class UserPortraitDetail(BaseModel):
    portraitID: str
    avatar: str
    createdAt: int
    updatedAt: int
    userName: str
    age: Optional[int]
    profession: str
    mbti: MBTIData
    big5: Big5Data
    familyTies: str


class UserPortraitDetailData(BaseModel):
    userPortrait: UserPortraitDetail


# ---- 家庭画像 ----

class FamilyPortraitDetail(BaseModel):
    familyID: str
    createdAt: int
    updatedAt: int
    content: str


class FamilyPortraitData(BaseModel):
    familyPortrait: FamilyPortraitDetail

class ReceiveMessageRequest(BaseModel):
    """用于接收新消息的数据校验模型"""
    userID: Optional[str] = None      # 对应的用户ID（如果是系统消息可以为空）
    speakerType: str                  # 必须填：'user' | 'robot' | 'system'
    speakerID: str                    # 必须填：说话人的具体ID
    content: str                      # 必须填：消息内容
    messageType: str = "text"         # 选填：消息类型，默认是纯文本