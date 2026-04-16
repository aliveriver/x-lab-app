"""
models/__init__.py
导入全部模型，确保 Base.metadata 中注册了所有表
"""
from models.user import User
from models.robot import Robot
from models.binding import UserRobotBinding
from models.message import Message
from models.summary import Summary
from models.personality import PersonalityPreset, RobotPersonalityRecord
from models.tone import Tone
from models.skill import Skill, RobotSkill
from models.portrait import UserPortrait
from models.family_portrait import FamilyPortrait

# database.py 中通过 from models import __all_models__ 触发此文件加载
__all_models__ = [
    User,
    Robot,
    UserRobotBinding,
    Message,
    Summary,
    PersonalityPreset,
    RobotPersonalityRecord,
    Tone,
    Skill,
    RobotSkill,
    UserPortrait,
    FamilyPortrait,
]
