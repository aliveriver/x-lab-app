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
from models.skill import Skill,RobotSkill
from models.personality import PersonalityPreset
from models.robot import Robot
from models.user import User
from models.message import Message
# 原有的导入...
from models.personality import PersonalityPreset, RobotPersonalityRecord # 新增 RobotPersonalityRecord
from models.summary import Summary
from models.portrait import UserPortrait
from models.binding import UserRobotBinding
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
        Tone(tone_name="活力少萝", provider="mock", voice_code="v005", demo_url="", created_at=ts, updated_at=ts),
        Tone(tone_name="清冷御姐", provider="mock", voice_code="v006", demo_url="", created_at=ts, updated_at=ts),
        Tone(tone_name="阳光少年", provider="mock", voice_code="v007", demo_url="", created_at=ts, updated_at=ts),
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
def seed_robot_personality():
    """初始化机器人的当前人格记录"""
    robot_id = "ROBOT-DEMO-001"
    
    # 检查是否已经有人格记录
    existing = db.query(RobotPersonalityRecord).filter(
        RobotPersonalityRecord.robot_id == robot_id,
        RobotPersonalityRecord.is_current == 1
    ).first()
    
    if existing:
        print(f"机器人 {robot_id} 的人格记录已存在，跳过")
        return

    # 从系统预设中取第一条（比如“温暖陪伴型”）作为机器人的初始人格
    preset = db.query(PersonalityPreset).first()
    if not preset:
        print("未找到预设人格，无法为机器人初始化人格。请确保先执行 seed_personalities")
        return

    # 完整继承预设人格的各项数值
    robot_personality = RobotPersonalityRecord(
        personality_record_id=new_uuid(),
        robot_id=robot_id,
        source="preset",
        preset_personality_id=preset.personality_id,
        is_current=1,
        mbti_e=preset.mbti_e, mbti_i=preset.mbti_i,
        mbti_s=preset.mbti_s, mbti_n=preset.mbti_n,
        mbti_t=preset.mbti_t, mbti_f=preset.mbti_f,
        mbti_j=preset.mbti_j, mbti_p=preset.mbti_p,
        big5_neuroticism=preset.big5_neuroticism,
        big5_extraversion=preset.big5_extraversion,
        big5_openness=preset.big5_openness,
        big5_agreeableness=preset.big5_agreeableness,
        big5_conscientiousness=preset.big5_conscientiousness,
        created_at=ts,
        updated_at=ts
    )
    db.add(robot_personality)
    print(f"写入机器人 {robot_id} 的人格记录 (继承自预设: {preset.personality_name})")


def seed_robot_skills():
    """初始化机器人的技能关联"""
    robot_id = "ROBOT-DEMO-001"
    
    # 检查是否已经分配过技能
    existing_skills = db.query(RobotSkill).filter(RobotSkill.robot_id == robot_id).count()
    if existing_skills > 0:
        print(f"机器人 {robot_id} 已分配 {existing_skills} 个技能，跳过")
        return

    # 获取所有基础技能
    all_skills = db.query(Skill).all()
    if not all_skills:
        print("基础技能库为空，无法为机器人分配技能。请确保先执行 seed_skills")
        return

    # 给该机器人分配前 3 个基础技能作为演示
    robot_skills_to_add = []
    for skill in all_skills[:3]:
        robot_skills_to_add.append(
            RobotSkill(
                robot_skill_id=new_uuid(),
                robot_id=robot_id,
                skill_id=skill.skill_id,
                enabled=1,
                created_at=ts,
                updated_at=ts
            )
        )
    
    db.add_all(robot_skills_to_add)
    print(f"为机器人 {robot_id} 绑定了 {len(robot_skills_to_add)} 个初始技能")
def seed_messages():
    """
    初始化测试用的聊天记录（播种消息）
    """
    # 1. 检查是否已经有消息了。如果有，说明不是空库，直接跳过，防止每次启动都重复插入
    existing_msg = db.query(Message).filter(Message.deleted_at.is_(None)).first()
    if existing_msg:
        print("messages already exist, skip.")
        return

    # 2. 找一个用户和一个机器人来作为这场对话的主角
    user = db.query(User).filter(User.deleted_at.is_(None)).first()
    robot = db.query(Robot).filter(Robot.deleted_at.is_(None)).first()

    if not user or not robot:
        print("no user or robot found to attach messages, please seed user/robot first.")
        return

    # 3. 准备当前时间戳，并制造一点时间差（让消息有先后顺序）
    ts = now_ms()
    
    print("seeding default messages...")

    # 4. 捏造一段模拟对话
    mock_messages = [
        # 第一句：用户发出的问候
        Message(
            message_id=new_uuid(),
            robot_id=robot.robot_id,
            user_id=user.user_id,
            speaker_type="user",
            speaker_id=user.user_id,
            content="你好，小助手！初次见面。",
            message_type="text",
            created_at=ts - 100000,
            updated_at=ts - 100000,
        ),
        # 第二句：机器人的回复
        Message(
            message_id=new_uuid(),
            robot_id=robot.robot_id,
            user_id=user.user_id,
            speaker_type="robot",
            speaker_id=robot.robot_id,
            content="你好呀！我是你的专属AI机器人，已经准备好为你服务了。今天想聊点什么呢？",
            message_type="text",
            created_at=ts - 95000,
            updated_at=ts - 95000,
        ),
        # 第三句：一条系统提示消息
        Message(
            message_id=new_uuid(),
            robot_id=robot.robot_id,
            user_id=user.user_id,
            speaker_type="system",
            speaker_id="system",
            content="【系统提示】您已成功绑定该机器人设备，现在可以开始聊天了。",
            message_type="text",
            created_at=ts - 90000,
            updated_at=ts - 90000,
        ),
        Message(
            message_id=new_uuid(),
            robot_id=robot.robot_id,
            user_id=user.user_id,
            speaker_type="user",
            speaker_id=user.user_id,
            content="你能帮我做些什么？",
            message_type="text",
            created_at=ts - 85000,
            updated_at=ts - 85000,
        ),
        Message(
            message_id=new_uuid(),
            robot_id=robot.robot_id,
            user_id=user.user_id,
            speaker_type="robot",
            speaker_id=robot.robot_id,
            content="我可以陪你聊天，设置日历提醒，监测健康数据，甚至可以给你讲故事或者播报天气。你有什么特别想试试的吗？",
            message_type="text",
            created_at=ts - 80000,
            updated_at=ts - 80000,
        ),
        Message(
            message_id=new_uuid(),
            robot_id=robot.robot_id,
            user_id=user.user_id,
            speaker_type="user",
            speaker_id=user.user_id,
            content="听起来挺不错的。那你给我讲个故事吧。",
            message_type="text",
            created_at=ts - 75000,
            updated_at=ts - 75000,
        ),
        Message(
            message_id=new_uuid(),
            robot_id=robot.robot_id,
            user_id=user.user_id,
            speaker_type="robot",
            speaker_id=robot.robot_id,
            content="好的呀！从前，有一个小机器人，它来到了一个充满好奇心的新家庭。它很好奇这个世界是怎么样的，每天晚上它都会在夜空中寻找最亮的那颗星星...",
            message_type="text",
            created_at=ts - 70000,
            updated_at=ts - 70000,
        )
    ]

    # 5. 批量添加到数据库并提交保存
    db.add_all(mock_messages)
    db.commit()
    print(f"successfully seeded {len(mock_messages)} messages.")
def seed_summaries():
    """初始化测试用的对话摘要"""
    # 1. 检查是否已有摘要
    if db.query(Summary).count() > 0:
        print("摘要数据已存在，跳过")
        return

    # 2. 找到测试用户和机器人
    user = db.query(User).filter(User.deleted_at.is_(None)).first()
    robot = db.query(Robot).filter(Robot.deleted_at.is_(None)).first()

    if not user or not robot:
        print("未找到用户或机器人，无法生成摘要，请先执行前面的 seed 函数。")
        return

    # 3. 获取他们之间的历史消息，用来作为摘要的起止点
    messages = db.query(Message).filter(
        Message.robot_id == robot.robot_id,
        Message.user_id == user.user_id,
        Message.deleted_at.is_(None)
    ).order_by(Message.created_at.asc()).all()

    start_msg_id = messages[0].message_id if len(messages) > 0 else None
    end_msg_id = messages[-1].message_id if len(messages) > 1 else start_msg_id

    # 4. 创建一条模拟的对话摘要
    mock_summary = Summary(
        summary_id=new_uuid(),
        robot_id=robot.robot_id,
        user_id=user.user_id,
        strategy="manual",  # 模拟手动触发的摘要
        start_message_id=start_msg_id,
        end_message_id=end_msg_id,
        content="【模拟摘要】用户初次绑定了AI小助手，双方进行了简短、友好的互相问候。",
        created_at=ts,
        updated_at=ts
    )

    db.add(mock_summary)
    print("写入 1 条对话摘要数据")
def seed_user_portrait():
    """初始化测试用的用户画像数据"""
    # 1. 检查是否已经存在画像记录
    if db.query(UserPortrait).count() > 0:
        print("用户画像数据已存在，跳过")
        return

    # 2. 获取测试用的机器人ID（画像是机器人在与用户交流过程中对其建立的认知，所以关联 robot_id）
    robot = db.query(Robot).filter(Robot.deleted_at.is_(None)).first()
    if not robot:
        print("未找到测试机器人，无法生成用户画像。请确保先执行 seed_robot")
        return

    # 3. 构造一份模拟的用户画像（例如：一个INTP性格的年轻程序员）
    mock_portrait = UserPortrait(
        portrait_id=new_uuid(),
        robot_id=robot.robot_id,
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", # 随便给个随机头像URL
        user_name="测试体验官",
        age=25,
        profession="软件工程师",
        education_level="本科",
        family_ties="单身，独自居住在公寓，养了一只猫",
        dialogue_style="喜欢直接、高效的沟通方式，偏受理性的分析，偶尔带有冷幽默。",
        
        # MBTI 设定：INTP (内向I, 直觉N, 思考T, 感知P)
        mbti_e=20, mbti_i=80,  # I 偏好
        mbti_s=30, mbti_n=70,  # N 偏好
        mbti_t=85, mbti_f=15,  # T 偏好
        mbti_j=25, mbti_p=75,  # P 偏好
        
        # 大五人格设定
        big5_neuroticism=40,       # 神经质（情绪稳定性）: 偏稳重
        big5_extraversion=30,      # 外向性: 偏内向
        big5_openness=85,          # 开放性: 充满好奇心，乐于接受新事物
        big5_agreeableness=55,     # 宜人性: 中等偏上，讲道理
        big5_conscientiousness=70, # 尽责性: 工作认真，比较自律
        
        created_at=ts,
        updated_at=ts
    )

    db.add(mock_portrait)
    print("写入 1 条用户画像数据")
def seed_binding():
    """初始化用户与机器人的绑定关系"""
    # 1. 检查是否已经存在绑定关系
    if db.query(UserRobotBinding).count() > 0:
        print("绑定关系数据已存在，跳过")
        return

    # 2. 找到需要绑定的用户和机器人
    user = db.query(User).filter(User.deleted_at.is_(None)).first()
    robot = db.query(Robot).filter(Robot.deleted_at.is_(None)).first()

    if not user or not robot:
        print("未找到用户或机器人，无法建立绑定关系。请确保先执行 seed_robot 和 seed_admin_user")
        return

    # 3. 找到初始人格和音色（可选，但这里为了数据完整性我们查出来填进去）
    preset_personality = db.query(PersonalityPreset).first()
    preset_tone = db.query(Tone).first()

    personality_id = preset_personality.personality_id if preset_personality else None
    tone_id = preset_tone.tone_id if preset_tone else None

    # 4. 创建绑定记录
    mock_binding = UserRobotBinding(
        binding_id=new_uuid(),
        user_id=user.user_id,
        robot_id=robot.robot_id,
        robot_alias="我的专属小星",  # 用户给机器人起的自定义昵称
        init_personality_id=personality_id,
        bind_tone_id=tone_id,
        created_at=ts,
        updated_at=ts
    )

    db.add(mock_binding)
    print(f"写入 1 条绑定关系数据：User({user.user_name}) <-> Robot({robot.robot_name})")
if __name__ == "__main__":
    # 1. 基础实体数据（先有鸡，才能下蛋）
    seed_tones()
    seed_skills()
    seed_personalities()
    seed_robot()
    seed_admin_user()
    db.commit() 
    seed_robot_personality()
    seed_robot_skills()
    seed_binding()
    db.commit() 
    seed_messages()
    seed_summaries() 
    seed_user_portrait()
    db.commit()
    db.close()
    print("Seed 完成！")
