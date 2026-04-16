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
    deps.py              # 数据库依赖、当前用户鉴权依赖
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

用户能力：

- 登录 / 注册：`POST /api/user/token`
- 用户信息读取和修改：`GET /api/user/{userID}/info`、`PUT /api/user/{userID}/info/change`
- 机器人列表：`GET /api/user/{userID}/robot`
- 绑定机器人：`POST /api/user/robot/bind`
- 解绑机器人：`DELETE /api/user/robot/unbind`
- 修改机器人别名：`PUT /api/user/robot/alias`

机器人选项能力。这些接口用于绑定前选择，只要求 token 有效，不要求用户已绑定该机器人：

- 音色列表：`GET /api/robot/{robotID}/tone`
- 初始人格列表：`GET /api/robot/{robotID}/initPersonality`
- 技能列表：`GET /api/robot/{robotID}/skill`

机器人数据能力。这些接口需要 token，并按 `users.is_admin` 和用户绑定关系控制权限：

- 机器人当前人格：`GET /api/robot/{robotID}/personality`
- 修改机器人人格：`PUT /api/robot/{robotID}/personality/change`
- 修改机器人音色：`PUT /api/robot/{robotID}/tone/change`
- 消息和摘要：`GET /api/robot/{robotID}/message/{cursor}/{limit}`、`GET /api/robot/{robotID}/abstract/{cursor}/{limit}`
- 用户画像和家庭画像：`GET /api/robot/{robotID}/userportrait`、`GET /api/robot/{robotID}/userportrait/{portraitID}`、`GET /api/robot/{robotID}/familyportrait`

## 权限规则

- token 里包含当前用户 `userID`。
- 管理员标识存储在 `users.is_admin` 字段，`1` 表示管理员，`0` 表示普通用户。
- 管理员调用 `GET /api/user/{userID}/robot` 时返回所有未删除机器人；普通用户只返回自己的绑定机器人。
- 管理员可以读取和修改任意机器人的人格、音色、消息、摘要、用户画像和家庭画像。
- 普通用户访问机器人数据接口时，必须已绑定对应 `robotID`。
- 普通用户未绑定对应机器人时，接口返回统一业务响应：`code=403`、`data=null`、`msg="权限不足：当前用户未绑定该机器人"`。
- `tone`、`initPersonality`、`skill` 三个选项列表接口不校验绑定关系，便于绑定前拉取候选项。

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
