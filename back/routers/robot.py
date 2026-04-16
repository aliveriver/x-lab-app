"""
routers/robot.py
机器人相关路由：人格、消息、摘要、音色、画像、技能
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from deps import get_db, get_current_user_id
from models.robot import Robot
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
    ChangePersonalityRequest,
    ChangeToneRequest,
    ToneItem, ToneListData,
    PersonalityPresetItem, PersonalityListData,
    SkillItem, SkillListData,
    MessageItem, PageMeta, MessageListData,
    AbstractItem, AbstractListData,
    UserPortraitItem, UserPortraitListData,
    UserPortraitDetail, UserPortraitDetailData,
    FamilyPortraitDetail, FamilyPortraitData,
)
from utils import now_ms, new_uuid

router = APIRouter(prefix="/api/robot", tags=["机器人"])


def _get_robot_or_404(robot_id: str, db: Session) -> Robot:
    """通用：查找机器人，不存在则抛 404"""
    robot = db.query(Robot).filter(Robot.robot_id == robot_id, Robot.deleted_at.is_(None)).first()
    if robot is None:
        raise HTTPException(status_code=404, detail="机器人不存在")
    return robot


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


# ---- 人格接口 ----

@router.get("/{robotID}/personality", response_model=R[PersonalityData], summary="获取机器人当前人格")
def get_personality(
    robotID: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
):
    _get_robot_or_404(robotID, db)
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


@router.put("/{robotID}/personality/change", response_model=R, summary="修改机器人人格")
def change_personality(
    robotID: str,
    body: ChangePersonalityRequest,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
):
    """
    将旧的当前人格标记为历史，新建一条 is_current=1 的人格记录。
    """
    _get_robot_or_404(robotID, db)
    ts = now_ms()

    # 旧人格设为历史
    db.query(RobotPersonalityRecord).filter(
        RobotPersonalityRecord.robot_id == robotID,
        RobotPersonalityRecord.is_current == 1,
        RobotPersonalityRecord.deleted_at.is_(None),
    ).update({"is_current": 0, "updated_at": ts})

    # 新建当前人格
    record = RobotPersonalityRecord(
        personality_record_id=new_uuid(),
        robot_id=robotID,
        source="manual",
        is_current=1,
        mbti_e=body.mbti.E, mbti_i=body.mbti.I,
        mbti_s=body.mbti.S, mbti_n=body.mbti.N,
        mbti_t=body.mbti.T, mbti_f=body.mbti.F,
        mbti_j=body.mbti.J, mbti_p=body.mbti.P,
        big5_neuroticism=body.big5.neuroticism,
        big5_extraversion=body.big5.extraversion,
        big5_openness=body.big5.openness,
        big5_agreeableness=body.big5.agreeableness,
        big5_conscientiousness=body.big5.conscientiousness,
        created_at=ts,
        updated_at=ts,
    )
    db.add(record)
    db.commit()
    return R.ok()


# ---- 音色接口 ----

@router.put("/{robotID}/tone/change", response_model=R, summary="修改机器人音色")
def change_tone(
    robotID: str,
    body: ChangeToneRequest,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
):
    robot = _get_robot_or_404(robotID, db)
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
    _get_robot_or_404(robotID, db)
    skills = db.query(Skill).filter(Skill.enabled == 1, Skill.deleted_at.is_(None)).all()
    return R.ok(data=SkillListData(
        skillList=[SkillItem(skillID=s.skill_id, skillName=s.skill_name) for s in skills]
    ))


# ---- 消息分页 ----

@router.get("/{robotID}/message/{cursor}/{limit}", response_model=R[MessageListData], summary="分页获取消息记录")
def get_messages(
    robotID: str,
    cursor: int,
    limit: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
):
    """
    基于 created_at 时间戳游标分页。
    cursor=0 表示从最新开始，非 0 表示查询 created_at < cursor 的记录（向历史方向翻页）。
    """
    _get_robot_or_404(robotID, db)

    query = db.query(Message).filter(
        Message.robot_id == robotID,
        Message.deleted_at.is_(None),
    )
    if cursor != 0:
        query = query.filter(Message.created_at < cursor)

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

@router.get("/{robotID}/abstract/{cursor}/{limit}", response_model=R[AbstractListData], summary="分页获取摘要")
def get_abstracts(
    robotID: str,
    cursor: int,
    limit: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
):
    """与消息分页逻辑相同，cursor=0 从最新开始"""
    _get_robot_or_404(robotID, db)

    query = db.query(Summary).filter(
        Summary.robot_id == robotID,
        Summary.deleted_at.is_(None),
    )
    if cursor != 0:
        query = query.filter(Summary.created_at < cursor)

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
    _: str = Depends(get_current_user_id),
):
    _get_robot_or_404(robotID, db)
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
    _: str = Depends(get_current_user_id),
):
    _get_robot_or_404(robotID, db)
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
    _: str = Depends(get_current_user_id),
):
    _get_robot_or_404(robotID, db)
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
