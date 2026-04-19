"""
routers/robot.py
机器人相关路由：人格、消息、摘要、音色、画像、技能
"""
from fastapi import APIRouter, Depends, HTTPException, Query,BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from sqlalchemy import func
from database import SessionLocal
from deps import get_db, get_current_user_id
from models.user import User
from models.robot import Robot
from models.binding import UserRobotBinding
from models.message import Message
from models.summary import Summary
from models.personality import RobotPersonalityRecord, PersonalityPreset
from models.tone import Tone
from models.skill import Skill
from models.portrait import UserPortrait
from models.family_portrait import FamilyPortrait
from schemas.common import R
from schemas.robot import (
    PersonalityData, MBTIData, Big5Data,
    ChangeToneRequest,
    ToneItem, ToneListData,
    PersonalityPresetItem, PersonalityListData,
    SkillItem, SkillListData,
    MessageItem, PageMeta, MessageListData,
    AbstractItem, AbstractListData,
    UserPortraitItem, UserPortraitListData,
    UserPortraitDetail, UserPortraitDetailData,
    FamilyPortraitDetail, FamilyPortraitData,
    ReceiveMessageRequest
)
from utils import now_ms, new_uuid,call_llm_for_memory_and_profile, call_llm_for_personality_update

router = APIRouter(prefix="/api/robot", tags=["机器人"])


def _get_robot_or_404(robot_id: str, db: Session) -> Robot:
    """通用：查找机器人，不存在则抛 404"""
    robot = db.query(Robot).filter(Robot.robot_id == robot_id, Robot.deleted_at.is_(None)).first()
    if robot is None:
        raise HTTPException(status_code=404, detail="机器人不存在")
    return robot


def _get_robot_for_user_or_none(robot_id: str, current_user_id: str, db: Session) -> Robot | None:
    """Return the robot when the current user is allowed to access it.

    Admin users can access every robot. Normal users can only access robots
    they have an active binding for. A missing binding is represented as None
    so handlers can return the frontend's normal R payload instead of an HTTP
    exception.
    """
    robot = _get_robot_or_404(robot_id, db)
    current_user = (
        db.query(User)
        .filter(User.user_id == current_user_id, User.deleted_at.is_(None))
        .first()
    )
    if current_user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    if current_user.is_admin == 1:
        return robot

    binding = (
        db.query(UserRobotBinding)
        .filter(
            UserRobotBinding.user_id == current_user_id,
            UserRobotBinding.robot_id == robot_id,
            UserRobotBinding.deleted_at.is_(None),
        )
        .first()
    )
    if binding is None:
        return None
    return robot


def _permission_denied_response() -> R:
    return R.fail(code=403, msg="权限不足：当前用户未绑定该机器人")


def _build_personality_data(record: RobotPersonalityRecord) -> PersonalityData:
    """将人格记录 ORM 对象转为 PersonalityData schema"""
    return PersonalityData(
        mbti=MBTIData(
            E=record.mbti_e, I=record.mbti_i,
            S=record.mbti_s, N=record.mbti_n,
            T=record.mbti_t, F=record.mbti_f,
            J=record.mbti_j, P=record.mbti_p,
        ),
        big5=Big5Data(
            neuroticism=record.big5_neuroticism,
            extraversion=record.big5_extraversion,
            openness=record.big5_openness,
            agreeableness=record.big5_agreeableness,
            conscientiousness=record.big5_conscientiousness,
        ),
    )

# ==========================================
# 核心业务逻辑：记忆结算与演化
# ==========================================

def process_memories_and_profiles(db: Session):
    """功能 1：处理对话记录，生成专属记忆并更新画像"""
    ts = now_ms()
    # 计算 24 小时前的时间戳 (24小时 * 60分 * 60秒 * 1000毫秒)
    twenty_four_hours_ago = ts - (24 * 60 * 60 * 1000)
    
    # 1. 找到过去 24 小时内发生过对话的 (robot_id, user_id) 组合
    chat_pairs = db.query(Message.robot_id, Message.user_id).filter(
        Message.user_id.isnot(None), 
        Message.created_at >= twenty_four_hours_ago, # 👈 时间限制：只查24h内
        Message.deleted_at.is_(None)
    ).distinct().all()

    for r_id, u_id in chat_pairs:
        # 2. 拿到他们 24 小时内的对话记录（不再硬性限制20条，而是时间范围）
        recent_msgs = db.query(Message).filter(
            Message.robot_id == r_id,
            Message.user_id == u_id,
            Message.created_at >= twenty_four_hours_ago, # 👈 时间限制
            Message.deleted_at.is_(None)
        ).order_by(Message.created_at.asc()).all() # 按时间正序排列给AI看
        
        if not recent_msgs:
            continue
        start_msg_id = recent_msgs[0].message_id
        end_msg_id = recent_msgs[-1].message_id    
        chat_text = "\n".join([f"{'机器人' if m.speaker_type=='robot' else '用户'}: {m.content}" for m in recent_msgs])
        
        # 获取该用户之前的总结记忆（留白处补全）
        last_summary = db.query(Summary).filter(
            Summary.robot_id == r_id,
            Summary.user_id == u_id
        ).order_by(Summary.created_at.desc()).first()
        summary_before = last_summary.content if last_summary else "无历史记忆"
        
        # 3. 调用 AI 提取记忆和画像
        llm_result = call_llm_for_memory_and_profile(chat_text, summary_before)
        
        # 4. 存入 Summary 表 (长期记忆)
        new_summary = Summary(
            summary_id=new_uuid(),
            robot_id=r_id,
            user_id=u_id,
            strategy="daily_batch", # 修改为日批次处理
            start_message_id=start_msg_id,
            end_message_id=end_msg_id,
            content=llm_result["memory_summary"],
            created_at=ts,
            updated_at=ts
        )
        db.add(new_summary)
        
     # 5. 更新或创建 UserPortrait 表 (用户画像)
        portrait = db.query(UserPortrait).filter(
            UserPortrait.robot_id == r_id, 
            UserPortrait.user_id == u_id,  # 👈 新增：必须同时匹配当前用户
            UserPortrait.deleted_at.is_(None)
        ).first()
        
        if not portrait:
            portrait = UserPortrait(
                portrait_id=new_uuid(),
                robot_id=r_id,
                user_id=u_id,  # 👈 新增：创建时也要带上 user_id
                created_at=ts,
                updated_at=ts
            )
            db.add(portrait)
            
        # 更新画像属性
        updates = llm_result["profile_updates"]
        portrait.profession = updates.get("profession", portrait.profession)
        portrait.dialogue_style = updates.get("dialogue_style", portrait.dialogue_style)
        portrait.big5_neuroticism = updates.get("neuroticism", portrait.big5_neuroticism)
        portrait.updated_at = ts

    db.commit()


def update_robot_personality(db: Session):
    """功能 2：根据近期记忆，动态演化机器人大五人格"""
    ts = now_ms()
    
    # 1. 获取所有机器人当前的人格记录
    current_records = db.query(RobotPersonalityRecord).filter(
        RobotPersonalityRecord.is_current == 1,
        RobotPersonalityRecord.deleted_at.is_(None)
    ).all()
    
    for record in current_records:
        r_id = record.robot_id
        
        # 2. 获取该机器人最近生成的 5 条记忆 (Summary)
        recent_summaries = db.query(Summary).filter(
            Summary.robot_id == r_id,
            Summary.deleted_at.is_(None)
        ).order_by(Summary.created_at.desc()).limit(5).all()
        
        if not recent_summaries:
            continue
            
        memories_text = "\n".join([s.content for s in recent_summaries])
        
        # 3. 调用 AI 计算新的人格参数
        new_traits = call_llm_for_personality_update(record, memories_text)
        
        # 4. 核心逻辑：确保该机器人的【所有】旧人格都被标记为历史
        db.query(RobotPersonalityRecord).filter(
            RobotPersonalityRecord.robot_id == r_id,
            RobotPersonalityRecord.is_current == 1
        ).update(
            {"is_current": 0, "updated_at": ts}, 
            synchronize_session=False 
        )
        
        new_record = RobotPersonalityRecord(
            personality_record_id=new_uuid(),
            robot_id=r_id,
            source="analysis", # 标记为系统分析演化得来
            is_current=1,
            created_at=ts,
            updated_at=ts,
            **new_traits # 将字典解包赋值给对应的列
        )
        db.add(new_record)
        
    db.commit()
# ---- 人格接口 ----

@router.get("/{robotID}/personality", response_model=R[PersonalityData], summary="获取机器人当前人格")
def get_personality(
    robotID: str,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    if _get_robot_for_user_or_none(robotID, current_user_id, db) is None:
        return _permission_denied_response()
    record = (
        db.query(RobotPersonalityRecord)
        .filter(
            RobotPersonalityRecord.robot_id == robotID,
            RobotPersonalityRecord.is_current == 1,
            RobotPersonalityRecord.deleted_at.is_(None),
        )
        .first()
    )
    if record is None:
        raise HTTPException(status_code=404, detail="机器人尚未设置人格")
    return R.ok(data=_build_personality_data(record))


@router.put("/{robotID}/personality/change", response_model=R, summary="修改机器人人格（已禁用）")
def change_personality(
    robotID: str,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    """
    将旧的当前人格标记为历史，新建一条 is_current=1 的人格记录。
    """
    if _get_robot_for_user_or_none(robotID, current_user_id, db) is None:
        return _permission_denied_response()
    return R.fail(code=403, msg="机器人绑定后不允许修改人格")


# ---- 音色接口 ----

@router.put("/{robotID}/tone/change", response_model=R, summary="修改机器人音色")
def change_tone(
    robotID: str,
    body: ChangeToneRequest,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    robot = _get_robot_for_user_or_none(robotID, current_user_id, db)
    if robot is None:
        return _permission_denied_response()
    tone = db.query(Tone).filter(Tone.tone_id == body.toneID, Tone.deleted_at.is_(None)).first()
    if tone is None:
        raise HTTPException(status_code=404, detail="音色不存在")

    robot.current_tone_id = body.toneID
    robot.updated_at = now_ms()
    db.commit()
    return R.ok()


@router.get("/{robotID}/tone", response_model=R[ToneListData], summary="获取全部可用音色")
def list_tones(
    robotID: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
):
    tones = db.query(Tone).filter(Tone.enabled == 1, Tone.deleted_at.is_(None)).all()
    return R.ok(data=ToneListData(
        toneList=[ToneItem(toneID=t.tone_id, toneName=t.tone_name) for t in tones]
    ))


# ---- 初始人格列表 ----

@router.get("/{robotID}/initPersonality", response_model=R[PersonalityListData], summary="获取全部初始人格")
def list_init_personalities(
    robotID: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
):
    presets = (
        db.query(PersonalityPreset)
        .filter(PersonalityPreset.enabled == 1, PersonalityPreset.deleted_at.is_(None))
        .all()
    )
    return R.ok(data=PersonalityListData(
        personalityList=[
            PersonalityPresetItem(personalityID=p.personality_id, personalityName=p.personality_name)
            for p in presets
        ]
    ))


# ---- 技能列表 ----

@router.get("/{robotID}/skill", response_model=R[SkillListData], summary="获取全部技能")
def list_skills(
    robotID: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
):
    skills = db.query(Skill).filter(Skill.enabled == 1, Skill.deleted_at.is_(None)).all()
    return R.ok(data=SkillListData(
        skillList=[SkillItem(skillID=s.skill_id, skillName=s.skill_name) for s in skills]
    ))


# ---- 消息分页 ----

@router.get("/{robotID}/message", response_model=R[MessageListData], summary="分页获取消息记录")
def get_messages(
    robotID: str,
    cursor: int = Query(..., ge=0),
    limit: int = Query(..., ge=1),
    startTime: Optional[int] = None,
    endTime: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    """
    基于 created_at 时间戳游标分页。
    cursor=0 表示从最新开始，非 0 表示查询 created_at < cursor 的记录（向历史方向翻页）。
    """
    if _get_robot_for_user_or_none(robotID, current_user_id, db) is None:
        return _permission_denied_response()

    query = db.query(Message).filter(
        Message.robot_id == robotID,
        Message.user_id== current_user_id,   #只返回该用户的消息,一对多？
        Message.deleted_at.is_(None),
    )
    if cursor != 0:
        query = query.filter(Message.created_at < cursor)
        
    if startTime is not None:
        query = query.filter(Message.created_at >= startTime)
    if endTime is not None:
        query = query.filter(Message.created_at <= endTime)

    messages = (
        query.order_by(Message.created_at.desc())
        .limit(limit + 1)  # 多取一条判断 hasMore
        .all()
    )

    has_more = len(messages) > limit
    if has_more:
        messages = messages[:limit]

    next_cursor = str(messages[-1].created_at) if messages else "0"

    return R.ok(data=MessageListData(
        messageList=[
            MessageItem(
                messageID=m.message_id,
                createdAt=m.created_at,
                content=m.content,
                belong=m.speaker_id,
            )
            for m in messages
        ],
        meta=PageMeta(nextCursor=next_cursor, hasMore=has_more),
    ))


# ---- 摘要分页 ----

@router.get("/{robotID}/abstract", response_model=R[AbstractListData], summary="分页获取摘要")
def get_abstracts(
    robotID: str,
    cursor: int = Query(..., ge=0),
    limit: int = Query(..., ge=1),
    startTime: Optional[int] = None,
    endTime: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    """与消息分页逻辑相同，cursor=0 从最新开始"""
    if _get_robot_for_user_or_none(robotID, current_user_id, db) is None:
        return _permission_denied_response()

    query = db.query(Summary).filter(
        Summary.robot_id == robotID,
        Summary.user_id== current_user_id,   #只返回该用户的消息，一对多？
        Summary.deleted_at.is_(None),
    )
    if cursor != 0:
        query = query.filter(Summary.created_at < cursor)

    if startTime is not None:
        query = query.filter(Summary.created_at >= startTime)
    if endTime is not None:
        query = query.filter(Summary.created_at <= endTime)

    summaries = (
        query.order_by(Summary.created_at.desc())
        .limit(limit + 1)
        .all()
    )

    has_more = len(summaries) > limit
    if has_more:
        summaries = summaries[:limit]

    next_cursor = str(summaries[-1].created_at) if summaries else "0"

    return R.ok(data=AbstractListData(
        abstractList=[
            AbstractItem(
                abstractID=s.summary_id,
                createdAt=s.created_at,
                content=s.content,
            )
            for s in summaries
        ],
        meta=PageMeta(nextCursor=next_cursor, hasMore=has_more),
    ))


# ---- 用户画像 ----

@router.get("/{robotID}/userportrait", response_model=R[UserPortraitListData], summary="获取用户画像列表")
def list_user_portraits(
    robotID: str,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    if _get_robot_for_user_or_none(robotID, current_user_id, db) is None:
        return _permission_denied_response()
    portraits = (
        db.query(UserPortrait)
        .filter(UserPortrait.robot_id == robotID, UserPortrait.deleted_at.is_(None))
        .all()
    )
    return R.ok(data=UserPortraitListData(
        userPortraitList=[
            UserPortraitItem(portraitID=p.portrait_id, avatar=p.avatar)
            for p in portraits
        ]
    ))


@router.get(
    "/{robotID}/userportrait/{portraitID}",
    response_model=R[UserPortraitDetailData],
    summary="查看具体用户画像",
)
def get_user_portrait(
    robotID: str,
    portraitID: str,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    if _get_robot_for_user_or_none(robotID, current_user_id, db) is None:
        return _permission_denied_response()
    portrait = (
        db.query(UserPortrait)
        .filter(
            UserPortrait.portrait_id == portraitID,
            UserPortrait.robot_id == robotID,
            UserPortrait.deleted_at.is_(None),
        )
        .first()
    )
    if portrait is None:
        raise HTTPException(status_code=404, detail="用户画像不存在")

    return R.ok(data=UserPortraitDetailData(
        userPortrait=UserPortraitDetail(
            portraitID=portrait.portrait_id,
            avatar=portrait.avatar,
            createdAt=portrait.created_at,
            updatedAt=portrait.updated_at,
            userName=portrait.user_name,
            age=portrait.age,
            profession=portrait.profession,
            mbti=MBTIData(
                E=portrait.mbti_e, I=portrait.mbti_i,
                S=portrait.mbti_s, N=portrait.mbti_n,
                T=portrait.mbti_t, F=portrait.mbti_f,
                J=portrait.mbti_j, P=portrait.mbti_p,
            ),
            big5=Big5Data(
                neuroticism=portrait.big5_neuroticism,
                extraversion=portrait.big5_extraversion,
                openness=portrait.big5_openness,
                agreeableness=portrait.big5_agreeableness,
                conscientiousness=portrait.big5_conscientiousness,
            ),
            familyTies=portrait.family_ties,
        )
    ))


# ---- 家庭画像 ----

@router.get("/{robotID}/familyportrait", response_model=R[FamilyPortraitData], summary="获取家庭画像")
def get_family_portrait(
    robotID: str,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    if _get_robot_for_user_or_none(robotID, current_user_id, db) is None:
        return _permission_denied_response()
    portrait = (
        db.query(FamilyPortrait)
        .filter(
            FamilyPortrait.robot_id == robotID,
            FamilyPortrait.is_current == 1,
            FamilyPortrait.deleted_at.is_(None),
        )
        .first()
    )
    if portrait is None:
        raise HTTPException(status_code=404, detail="家庭画像不存在")

    return R.ok(data=FamilyPortraitData(
        familyPortrait=FamilyPortraitDetail(
            familyID=portrait.family_id,
            createdAt=portrait.created_at,
            updatedAt=portrait.updated_at,
            content=portrait.content,
        )
    ))
@router.post("/{robotID}/message", response_model=R, summary="接收并存储新消息")
def receive_message(
    robotID: str,
    body: ReceiveMessageRequest, 
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    """
    接收一条新聊天记录并存入数据库
    """
    if _get_robot_for_user_or_none(robotID, current_user_id, db) is None:
        return _permission_denied_response()
    ts = now_ms()
    new_message = Message(
        message_id=new_uuid(),          # 系统自动生成一个唯一的36位UUID
        robot_id=robotID,               # 从网址链接里拿到的机器人ID
        user_id=body.userID,            # 聊天所属的用户ID
        speaker_type=body.speakerType,  # 说话人的类型（是人还是机器人）
        speaker_id=body.speakerID,      # 说话人的具体ID
        content=body.content,           # 实际聊天的内容
        message_type=body.messageType,  # 比如 text（文本）、audio（语音）
        created_at=ts,                  # 记录的创建时间
        updated_at=ts,                  # 记录的更新时间（刚创建时和创建时间一样）
    )
    db.add(new_message)
    db.commit()
    return R.ok()



# ==========================================
# 触发演化的接口
# ==========================================

# ==========================================
# 触发演化的接口
# ==========================================

@router.post("/trigger_evolution", response_model=R, summary="【系统后台】手动立刻触发演化")
def trigger_evolution(
    db: Session = Depends(get_db)  # 直接复用请求自带的 db session
):
    """
    调用此接口后，服务器会立刻、同步读取聊天记录并演化性格。
    前端需要等待任务执行完毕才能拿到响应结果。
    """
    try:
        print("\n[AI手动触发] 1/2 开始提取用户画像和对话记忆...")
        process_memories_and_profiles(db)
        
        print("[AI手动触发] 2/2 开始推演机器人性格变化...")
        update_robot_personality(db)
        
        print("[AI手动触发] ✅ 演化全部完成！\n")
        
        # 任务跑完后，再返回成功消息
        return R.ok(msg="AI演化任务已立刻执行完毕！")
        
    except Exception as e:
        print(f"[AI手动触发] ❌ 发生错误: {e}")
        db.rollback()
        # 把错误信息抛给前端
        return R.fail(msg=f"演化任务执行失败: {str(e)}")