# X-Lab App Backend

后端使用 FastAPI + SQLAlchemy + SQLite，提供用户、机器人、记忆、画像和管理员权限能力。

## 技术栈

- FastAPI：HTTP API 框架
- SQLAlchemy 2：ORM 和数据库访问
- SQLite：本地开发数据库，文件为 `x_lab.db`
- Pydantic 2：请求和响应模型
- python-jose：JWT token 生成和校验
- Uvicorn：ASGI 服务

## 安装

```powershell
cd d:\x-lab-app\back
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

如果 `.venv` 已存在，直接安装依赖即可：

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## 初始化数据

```powershell
.\.venv\Scripts\python.exe seed.py
```

初始化内容：

- 音色基础数据
- 技能基础数据
- 初始人格预设
- 测试机器人 `ROBOT-DEMO-001`
- 默认管理员账号

默认管理员：

- 手机号：`18800000000`
- 验证码：任意 6 位数字，例如 `123456`

也可以通过环境变量覆盖管理员手机号和名称：

```powershell
$env:ADMIN_PHONE_NUMBER="18800000000"
$env:ADMIN_USER_NAME="管理员"
.\.venv\Scripts\python.exe seed.py
```

## 运行

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

接口文档：

```text
http://127.0.0.1:8000/docs
```

健康检查：

```text
http://127.0.0.1:8000/
```

## 目录结构

```text
back/
  main.py              # FastAPI app 入口，注册 CORS 和路由
  database.py          # 数据库连接、建表、SQLite 自动补列
  deps.py              # get_db、当前用户鉴权
  seed.py              # 初始化演示数据
  utils.py             # 时间戳、UUID、JWT 工具
  requirements.txt     # Python 依赖
  x_lab.db             # SQLite 本地数据库
  models/              # SQLAlchemy ORM 模型
  schemas/             # Pydantic 请求和响应模型
  routers/             # /api/user、/api/robot
```

## 路由概览

用户接口：

- `POST /api/user/token`
- `POST /api/user/robot/bind`
- `DELETE /api/user/robot/unbind`
- `PUT /api/user/robot/alias`
- `GET /api/user/{userID}/info`
- `PUT /api/user/{userID}/info/change`
- `GET /api/user/{userID}/robot`

机器人选项接口，只要求 token 有效，不要求用户已绑定机器人：

- `GET /api/robot/{robotID}/tone`
- `GET /api/robot/{robotID}/initPersonality`
- `GET /api/robot/{robotID}/skill`

机器人数据接口，需要 token，并按管理员或绑定关系校验权限：

- `GET /api/robot/{robotID}/personality`
- `PUT /api/robot/{robotID}/personality/change`
- `PUT /api/robot/{robotID}/tone/change`
- `GET /api/robot/{robotID}/message/{cursor}/{limit}`
- `GET /api/robot/{robotID}/abstract/{cursor}/{limit}`
- `GET /api/robot/{robotID}/userportrait`
- `GET /api/robot/{robotID}/userportrait/{portraitID}`
- `GET /api/robot/{robotID}/familyportrait`

## 管理员权限

管理员不使用新表，通过 `users.is_admin` 区分：

- `0`：普通用户
- `1`：管理员

权限行为：

- 管理员调用 `GET /api/user/{userID}/robot` 时返回所有未删除机器人。
- 普通用户调用 `GET /api/user/{userID}/robot` 时只返回自己的绑定机器人。
- 管理员可以读取和修改任意机器人的人格、音色、消息、摘要、用户画像和家庭画像。
- 普通用户访问机器人数据接口时，必须在 `user_robot_bindings` 中存在未删除绑定关系。
- 普通用户没有绑定对应机器人时，机器人数据接口返回 `code=403`、`data=null`、`msg="权限不足：当前用户未绑定该机器人"`。
- `tone`、`initPersonality`、`skill` 三个选项列表接口不校验绑定关系，保证用户绑定前可以拉取候选项。

## 检查

```powershell
.\.venv\Scripts\python.exe -m compileall -q main.py database.py deps.py utils.py seed.py routers schemas models
```
