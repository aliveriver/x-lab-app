"""
routers/user.py
用户相关路由：注册/登录、绑定/解绑机器人、用户信息
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from deps import get_db, get_current_user_id
from models.user import User
from models.robot import Robot
from models.binding import UserRobotBinding
from models.personality import RobotPersonalityRecord, PersonalityPreset
from schemas.common import R
from schemas.user import (
    TokenRequest, TokenData,
    UserInfo,
    BindRobotRequest, UnbindRobotRequest, ChangeRobotAliasRequest,
    ChangeUserInfoRequest,
    RobotItem, UserRobotListData,
)
from utils import now_ms, new_uuid, create_access_token

router = APIRouter(prefix="/api/user", tags=["用户"])


@router.post("/token", response_model=R[TokenData], summary="注册/登录")
def login_or_register(body: TokenRequest, db: Session = Depends(get_db)):
    """
    手机号 + 6 位数字验证码，开发阶段接受任意 6 位数字。
    用户不存在时自动注册；存在时直接颁发 token。
    """
    # 查找已存在的用户（未软删除）
    user = (
        db.query(User)
        .filter(User.phone_number == body.phonenumber, User.deleted_at.is_(None))
        .first()
    )

    ts = now_ms()
    if user is None:
        # 自动注册
        user = User(
            user_id=new_uuid(),
            phone_number=body.phonenumber,
            user_name="",
            avatar="",
            created_at=ts,
            updated_at=ts,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.user_id)
    return R.ok(data=TokenData(token=token, userID=user.user_id, isAdmin=user.is_admin))


@router.post("/robot/bind", response_model=R, summary="绑定机器人")
def bind_robot(
    body: BindRobotRequest,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
):
    """
    用户绑定机器人。
    若机器人编码不存在则自动创建机器人记录（允许先绑再建设备）。
    同一用户不能重复绑定同一机器人（软删除判断）。
    """
    ts = now_ms()

    # 检查机器人是否存在，不存在则自动创建
    robot = db.query(Robot).filter(Robot.robot_id == body.robotID, Robot.deleted_at.is_(None)).first()
    if robot is None:
        robot = Robot(
            robot_id=body.robotID,
            robot_name=body.robotID,
            model="",
            status=1,
            created_at=ts,
            updated_at=ts,
        )
        db.add(robot)

    # 检查是否已绑定（deleted_at IS NULL 表示仍绑定）
    existing = (
        db.query(UserRobotBinding)
        .filter(
            UserRobotBinding.user_id == body.userID,
            UserRobotBinding.robot_id == body.robotID,
            UserRobotBinding.deleted_at.is_(None),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="该机器人已绑定")

    current_personality = db.query(RobotPersonalityRecord).filter(
        RobotPersonalityRecord.robot_id == body.robotID,
        RobotPersonalityRecord.is_current == 1,
        RobotPersonalityRecord.deleted_at.is_(None),
    ).first()

    binding = UserRobotBinding(
        binding_id=new_uuid(),
        user_id=body.userID,
        robot_id=body.robotID,
        robot_alias=body.robotName or "",
        init_personality_id=current_personality.preset_personality_id if current_personality else body.personalityID,
        bind_tone_id=body.toneID,
        created_at=ts,
        updated_at=ts,
    )
    db.add(binding)

    # 只在机器人尚未有人格时按绑定参数初始化；绑定后不再覆盖人格。
    if body.personalityID is not None and current_personality is None:
        preset = db.query(PersonalityPreset).filter(
            PersonalityPreset.personality_id == body.personalityID,
            PersonalityPreset.deleted_at.is_(None),
        ).first()
        if preset:
            record = RobotPersonalityRecord(
                personality_record_id=new_uuid(),
                robot_id=body.robotID,
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
                updated_at=ts,
            )
            db.add(record)

    db.commit()
    return R.ok()


@router.delete("/robot/unbind", response_model=R, summary="解绑机器人")
def unbind_robot(
    body: UnbindRobotRequest,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
):
    """软删除绑定记录（设置 deleted_at）"""
    ts = now_ms()
    binding = (
        db.query(UserRobotBinding)
        .filter(
            UserRobotBinding.user_id == body.userID,
            UserRobotBinding.robot_id == body.robotID,
            UserRobotBinding.deleted_at.is_(None),
        )
        .first()
    )
    if binding is None:
        raise HTTPException(status_code=404, detail="绑定关系不存在")

    binding.deleted_at = ts
    binding.updated_at = ts
    db.commit()
    return R.ok()


@router.put("/robot/alias", response_model=R, summary="修改机器人别名")
def change_robot_alias(
    body: ChangeRobotAliasRequest,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
):
    """修改用户对机器人的备注名/别名"""
    ts = now_ms()
    binding = (
        db.query(UserRobotBinding)
        .filter(
            UserRobotBinding.user_id == body.userID,
            UserRobotBinding.robot_id == body.robotID,
            UserRobotBinding.deleted_at.is_(None),
        )
        .first()
    )
    if binding is None:
        raise HTTPException(status_code=404, detail="绑定关系不存在")

    binding.robot_alias = body.robotAlias
    binding.updated_at = ts
    db.commit()
    return R.ok()


@router.get("/{userID}/info", response_model=R[UserInfo], summary="获取用户信息")
def get_user_info(
    userID: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
):
    user = db.query(User).filter(User.user_id == userID, User.deleted_at.is_(None)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return R.ok(data=UserInfo(
        phonenumber=user.phone_number,
        userID=user.user_id,
        userName=user.user_name,
        avatar=user.avatar,
        isAdmin=user.is_admin,
    ))


@router.put("/{userID}/info/change", response_model=R, summary="修改用户信息")
def change_user_info(
    userID: str,
    body: ChangeUserInfoRequest,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
):
    """
    修改用户信息（手机号、昵称、头像）。
    验证码目前 mock 不校验，直接允许修改。
    仅传入非 None 的字段才会更新，支持部分更新。
    """
    user = db.query(User).filter(User.user_id == userID, User.deleted_at.is_(None)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")

    ts = now_ms()
    if body.phonenumber is not None:
        user.phone_number = body.phonenumber
    if body.userName is not None:
        user.user_name = body.userName
    if body.avatar is not None:
        user.avatar = body.avatar
    user.updated_at = ts
    db.commit()
    return R.ok()


@router.get("/{userID}/robot", response_model=R[UserRobotListData], summary="获取用户的机器人列表")
def get_user_robots(
    userID: str,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    """
    返回该用户绑定的所有机器人（未解绑）。
    robotName 优先使用用户给的昵称 robot_alias，为空时回退到机器人默认名。
    """
    current_user = db.query(User).filter(
        User.user_id == current_user_id,
        User.deleted_at.is_(None),
    ).first()
    if current_user is None:
        raise HTTPException(status_code=404, detail="ç”¨æˆ·ä¸å­˜åœ¨")

    if current_user.is_admin == 1:
        robots = db.query(Robot).filter(Robot.deleted_at.is_(None)).all()
        return R.ok(data=UserRobotListData(
            robotList=[
                RobotItem(
                    robotCode=r.robot_id, 
                    robotName=r.robot_name or r.robot_id,
                    toneID=r.current_tone_id,
                    personalityID=None 
                )
                for r in robots
            ]
        ))

    if current_user_id != userID:
        raise HTTPException(status_code=403, detail="æ— æƒæŸ¥çœ‹è¯¥ç”¨æˆ·çš„æœºå™¨äººåˆ—è¡¨")

    bindings = (
        db.query(UserRobotBinding)
        .filter(
            UserRobotBinding.user_id == userID,
            UserRobotBinding.deleted_at.is_(None),
        )
        .all()
    )

    robot_list = []
    for b in bindings:
        robot = db.query(Robot).filter(Robot.robot_id == b.robot_id).first()
        name = b.robot_alias or (robot.robot_name if robot else b.robot_id)
        
        # 尝试使用绑定时的音色如果没绑定调机器人当前设置的音色
        tone_id = b.bind_tone_id if b.bind_tone_id is not None else getattr(robot, 'current_tone_id', None)
        
        robot_list.append(RobotItem(
            robotCode=b.robot_id, 
            robotName=name,
            toneID=tone_id,
            personalityID=b.init_personality_id
        ))

    return R.ok(data=UserRobotListData(robotList=robot_list))
