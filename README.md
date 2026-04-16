# X-Lab App

X-Lab App 是一个机器人陪伴类应用原型，仓库按前后端分离组织：

- `back/`：FastAPI 后端，负责用户登录、机器人绑定、机器人资料、记忆、画像和管理员权限。
- `front/`：Expo React Native 前端，负责移动端和 Web 端页面。
- `接口.md`：接口约定文档。
- `数据库表.md`：数据库表结构说明。
- `需求分析.md`：需求说明。

## 环境要求

- Python 3.12 或兼容版本
- Node.js 与 npm
- Expo CLI 可通过 `npx expo` 使用

## 安装

后端：

```powershell
cd d:\x-lab-app\back
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

前端：

```powershell
cd d:\x-lab-app\front
npm install
```

## 初始化数据

```powershell
cd d:\x-lab-app\back
.\.venv\Scripts\python.exe seed.py
```

`seed.py` 会初始化音色、技能、人格预设、测试机器人，并创建默认管理员用户。

默认管理员：

- 手机号：`18800000000`
- 验证码：任意 6 位数字，例如 `123456`

## 运行

先启动后端：

```powershell
cd d:\x-lab-app\back
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

接口文档：

```text
http://127.0.0.1:8000/docs
```

再启动前端：

```powershell
cd d:\x-lab-app\front
npm run web
```

或运行移动端：

```powershell
npm run android
npm run ios
```

前端接口地址在 `front/utils/api.ts` 中配置：

- Android 模拟器：`http://10.0.2.2:8000`
- Web / iOS：`http://127.0.0.1:8000`

## 框架结构

```text
x-lab-app/
  back/
    main.py              # FastAPI 入口，挂载路由
    database.py          # SQLAlchemy 引擎、Session、建表和补列
    deps.py              # 数据库依赖、用户鉴权依赖
    seed.py              # 初始化演示数据和管理员账号
    utils.py             # UUID、时间戳、JWT 工具
    models/              # SQLAlchemy ORM 模型
    schemas/             # Pydantic 请求和响应模型
    routers/             # API 路由
  front/
    app/                 # Expo Router 页面
    components/          # UI 组件
    context/             # UserContext、RobotContext
    constants/           # 前端常量
    utils/               # API 请求封装
```

## 接口接入状态

已接入真实后端的前端能力：

- 登录 / 注册：`POST /api/user/token`
- 用户信息读取和修改：`GET /api/user/{userID}/info`、`PUT /api/user/{userID}/info/change`
- 机器人列表：`GET /api/user/{userID}/robot`
- 绑定机器人：`POST /api/user/robot/bind`
- 修改机器人别名：`PUT /api/user/robot/alias`

机器人数据能力也已接入真实后端：

- 机器人当前人格：`GET /api/robot/{robotID}/personality`
- 音色列表和修改：`GET /api/robot/{robotID}/tone`、`PUT /api/robot/{robotID}/tone/change`
- 初始人格列表：`GET /api/robot/{robotID}/initPersonality`
- 消息和摘要：`GET /api/robot/{robotID}/message/{cursor}/{limit}`、`GET /api/robot/{robotID}/abstract/{cursor}/{limit}`
- 用户画像和家庭画像：`GET /api/robot/{robotID}/userportrait`、`GET /api/robot/{robotID}/userportrait/{portraitID}`、`GET /api/robot/{robotID}/familyportrait`

管理员能力：

- 管理员标识存储在 `users.is_admin` 字段。
- 管理员使用现有机器人列表接口时可以看到所有机器人。

## 检查命令

后端编译检查：

```powershell
cd d:\x-lab-app\back
.\.venv\Scripts\python.exe -m compileall -q main.py database.py deps.py utils.py seed.py routers schemas models
```

前端类型检查：

```powershell
cd d:\x-lab-app\front
npx.cmd tsc --noEmit
```
