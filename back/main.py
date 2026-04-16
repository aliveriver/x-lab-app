"""
main.py
FastAPI 应用入口：注册路由、启动时建表、配置 CORS
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_all_tables
from routers.user import router as user_router
from routers.robot import router as robot_router

app = FastAPI(
    title="X-Lab App API",
    description="机器人管理后端接口",
    version="0.1.0",
)

# CORS（开发阶段允许全部来源）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(user_router)
app.include_router(robot_router)


@app.on_event("startup")
def startup():
    """服务启动时自动建表（幂等，已存在则跳过）"""
    create_all_tables()


@app.get("/", tags=["健康检查"])
def health():
    return {"status": "ok", "msg": "X-Lab API is running"}
