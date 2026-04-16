"""
seed.py
初始化测试数据：写入若干音色、技能、初始人格预设，以及一个测试机器人。
运行方式（在 back/ 目录下）：
    python seed.py
"""
import sys
import os

# 确保能找到同目录下的模块
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, create_all_tables
from models.tone import Tone
from models.skill import Skill
from models.personality import PersonalityPreset
from models.robot import Robot
from models.user import User
from utils import now_ms, new_uuid

create_all_tables()
db = SessionLocal()
ts = now_ms()


def seed_tones():
    if db.query(Tone).count() > 0:
        print("音色数据已存在，跳过")
        return
    tones = [
        Tone(tone_name="温柔女声", provider="mock", voice_code="v001", demo_url="", created_at=ts, updated_at=ts),
        Tone(tone_name="磁性男声", provider="mock", voice_code="v002", demo_url="", created_at=ts, updated_at=ts),
        Tone(tone_name="活泼童声", provider="mock", voice_code="v003", demo_url="", created_at=ts, updated_at=ts),
        Tone(tone_name="沉稳长者", provider="mock", voice_code="v004", demo_url="", created_at=ts, updated_at=ts),
    ]
    db.add_all(tones)
    print(f"写入 {len(tones)} 条音色数据")


def seed_skills():
    if db.query(Skill).count() > 0:
        print("技能数据已存在，跳过")
        return
    skills = [
        Skill(skill_name="日历提醒", skill_type="system", description="设置日历和提醒事项", created_at=ts, updated_at=ts),
        Skill(skill_name="情感陪伴", skill_type="llm", description="提供情感支持和聊天", created_at=ts, updated_at=ts),
        Skill(skill_name="健康监测", skill_type="board", description="实时监测用户健康数据", created_at=ts, updated_at=ts),
        Skill(skill_name="故事讲述", skill_type="llm", description="讲述各类故事和寓言", created_at=ts, updated_at=ts),
        Skill(skill_name="天气播报", skill_type="other", description="播报当地天气信息", created_at=ts, updated_at=ts),
    ]
    db.add_all(skills)
    print(f"写入 {len(skills)} 条技能数据")


def seed_personalities():
    if db.query(PersonalityPreset).count() > 0:
        print("初始人格数据已存在，跳过")
        return
    presets = [
        PersonalityPreset(
            personality_name="温暖陪伴型",
            description="外向、宜人、开放，适合日常情感陪伴",
            mbti_e=70, mbti_i=30, mbti_s=45, mbti_n=55,
            mbti_t=30, mbti_f=70, mbti_j=55, mbti_p=45,
            big5_neuroticism=25, big5_extraversion=75,
            big5_openness=70, big5_agreeableness=80, big5_conscientiousness=60,
            created_at=ts, updated_at=ts,
        ),
        PersonalityPreset(
            personality_name="睿智顾问型",
            description="内敛、理性、严谨，适合知识问答和生活规划",
            mbti_e=35, mbti_i=65, mbti_s=40, mbti_n=60,
            mbti_t=70, mbti_f=30, mbti_j=75, mbti_p=25,
            big5_neuroticism=30, big5_extraversion=40,
            big5_openness=75, big5_agreeableness=55, big5_conscientiousness=85,
            created_at=ts, updated_at=ts,
        ),
        PersonalityPreset(
            personality_name="活力伙伴型",
            description="外向活跃、感知直觉，适合娱乐互动",
            mbti_e=80, mbti_i=20, mbti_s=35, mbti_n=65,
            mbti_t=45, mbti_f=55, mbti_j=30, mbti_p=70,
            big5_neuroticism=20, big5_extraversion=85,
            big5_openness=80, big5_agreeableness=70, big5_conscientiousness=45,
            created_at=ts, updated_at=ts,
        ),
    ]
    db.add_all(presets)
    print(f"写入 {len(presets)} 条初始人格数据")


def seed_robot():
    if db.query(Robot).filter(Robot.robot_id == "ROBOT-DEMO-001").first():
        print("测试机器人已存在，跳过")
        return
    robot = Robot(
        robot_id="ROBOT-DEMO-001",
        robot_name="小星",
        model="X-Lab-v1",
        status=1,
        created_at=ts,
        updated_at=ts,
    )
    db.add(robot)
    print("写入测试机器人 ROBOT-DEMO-001")


def seed_admin_user():
    admin_phone = os.getenv("ADMIN_PHONE_NUMBER", "18800000000")
    admin_name = os.getenv("ADMIN_USER_NAME", "管理员")

    existing_admin = db.query(User).filter(
        User.is_admin == 1,
        User.deleted_at.is_(None),
    ).first()
    if existing_admin:
        print(f"admin user already exists, skip: {existing_admin.phone_number}")
        return

    user = db.query(User).filter(
        User.phone_number == admin_phone,
        User.deleted_at.is_(None),
    ).first()
    if user is None:
        user = User(
            user_id=new_uuid(),
            phone_number=admin_phone,
            user_name=admin_name,
            avatar="",
            is_admin=1,
            created_at=ts,
            updated_at=ts,
        )
        db.add(user)
        print(f"created admin user: {admin_phone}")
        return

    user.is_admin = 1
    if not user.user_name:
        user.user_name = admin_name
    user.updated_at = ts
    print(f"promoted existing user to admin: {admin_phone}")


if __name__ == "__main__":
    seed_tones()
    seed_skills()
    seed_personalities()
    seed_robot()
    seed_admin_user()
    db.commit()
    db.close()
    print("Seed 完成！")
