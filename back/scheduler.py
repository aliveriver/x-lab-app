# scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import traceback

# 导入你现有的模块
from database import SessionLocal
from routers.robot import process_memories_and_profiles, update_robot_personality

# 初始化调度器
scheduler = BackgroundScheduler()

def evolution_job():
    """演化任务：提取画像 + 更新人格"""
    db = SessionLocal() # 给定时任务单独开一个数据库连接
    try:
        print("\n[AI定时任务] 1/2 开始提取用户画像和对话记忆...")
        process_memories_and_profiles(db)
        
        print("[AI定时任务] 2/2 开始推演机器人性格变化...")
        update_robot_personality(db)
        
        print("[AI定时任务] [OK] 演化全部完成！\n")
    except Exception as e:
        print(f"[AI定时任务] [ERROR] 发生错误: {e}")
        traceback.print_exc()
        db.rollback() # 出错了就回滚数据库
    finally:
        db.close()    # 必须关闭连接，释放资源

def init_scheduler():
    """初始化并启动定时任务"""
    scheduler.add_job(
        evolution_job,
        trigger=IntervalTrigger(hours=24), # 设定为每 24 小时执行一次
        id="evolution_job",
        name="AI演化任务",
        replace_existing=True
    )
    scheduler.start()
    print("[定时任务] [STARTED] 已启动，每24小时将自动执行一次演化任务")

def shutdown_scheduler():
    """关闭定时任务"""
    scheduler.shutdown()
    print("[定时任务] [STOPPED] 已安全停止")