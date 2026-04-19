"""
utils.py
公共工具函数：13 位时间戳、UUID、JWT 生成与校验
"""
import uuid
import time
from datetime import timedelta
from typing import Optional

from jose import jwt, JWTError
# 确保文件顶部有这个 import（如果没有，就加上）
from models.personality import RobotPersonalityRecord

# ==========================================
# AI 大模型相关工具函数 (模拟)
# ==========================================
#后面涉及api_key 的代码，请忽略,感觉放在这里合理一点
def call_llm_for_memory_and_profile(chat_text: str,summary_before: str = "无历史记忆"):
    """【模拟】根据一段对话，生成记忆总结和用户画像更新，注意要加入提示词，用户画像可以不进行修改，加入聊天时间和前一段时间的对话"""
    return {
        "memory_summary": "用户最近遇到了工作瓶颈，情绪有点低落，我鼓励了TA。",
        "profile_updates": {
            "profession": "科研工作者",
            "dialogue_style": "偶尔深夜倾诉，需要安慰",
            # 大五人格微调预测
            "neuroticism": 60,
            "extraversion": 40
        }
    }

def call_llm_for_personality_update(current_record: RobotPersonalityRecord, memories_text: str):
    """【模拟】根据机器人最近的记忆，微调其性格向量"""
    # 模拟：经历安慰人的对话后，宜人性(agreeableness)上升，神经质(neuroticism)下降
    return {
        "big5_agreeableness": min(100, current_record.big5_agreeableness + 5),
        "big5_neuroticism": max(0, current_record.big5_neuroticism - 2),
        # 其他保持不变
        "big5_openness": current_record.big5_openness,
        "big5_extraversion": current_record.big5_extraversion,
        "big5_conscientiousness": current_record.big5_conscientiousness,
        # MBTI 保持原样 (简单起见)
        "mbti_e": current_record.mbti_e, "mbti_i": current_record.mbti_i,
        "mbti_s": current_record.mbti_s, "mbti_n": current_record.mbti_n,
        "mbti_t": current_record.mbti_t, "mbti_f": current_record.mbti_f,
        "mbti_j": current_record.mbti_j, "mbti_p": current_record.mbti_p,
    }
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

def get_fixed_uuid():  #方便测试加入确定id，要不然无法发送消息
    # 直接返回一个确定的 UUID
    return uuid.UUID('12345678-1234-5678-1234-567812345678')
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
