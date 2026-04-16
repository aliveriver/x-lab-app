# X-Lab App Frontend

前端使用 Expo + React Native + Expo Router，支持 Web、Android 和 iOS 运行。

## 技术栈

- Expo 54
- React 19
- React Native 0.81
- Expo Router 6
- TypeScript
- AsyncStorage
- React Native SVG

## 安装

```powershell
cd d:\x-lab-app\front
npm install
```

## 运行

Web：

```powershell
npm run web
```

Android：

```powershell
npm run android
```

iOS：

```powershell
npm run ios
```

通用 Expo 启动：

```powershell
npm start
```

## 后端地址

接口地址在 `utils/api.ts` 中配置：

```ts
export const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8000'
    : 'http://127.0.0.1:8000';
```

运行前端前，请先启动后端：

```powershell
cd d:\x-lab-app\back
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## 目录结构

```text
front/
  app/
    _layout.tsx          # 根布局，挂载 UserProvider 和 RobotProvider
    login.tsx            # 登录页面
    (tabs)/              # Tab 页面
    robot/[id].tsx       # 机器人详情
    portrait/            # 画像详情页面
    user/edit.tsx        # 用户信息编辑
  components/
    robot/               # 机器人相关组件和弹窗
    user/                # 用户相关组件
  constants/             # 前端常量
  context/
    UserContext.tsx      # 用户登录态和用户信息
    RobotContext.tsx     # 机器人列表、绑定和别名修改
  utils/
    api.ts               # fetchApi 封装和 API_BASE_URL
```

## 已接入接口

- 登录：`POST /api/user/token`
- 获取用户信息：`GET /api/user/{userID}/info`
- 修改用户信息：`PUT /api/user/{userID}/info/change`
- 获取机器人列表：`GET /api/user/{userID}/robot`
- 绑定机器人：`POST /api/user/robot/bind`
- 修改机器人别名：`PUT /api/user/robot/alias`
- 机器人当前人格：`GET /api/robot/{robotID}/personality`
- 音色列表和修改：`GET /api/robot/{robotID}/tone`、`PUT /api/robot/{robotID}/tone/change`
- 初始人格列表：`GET /api/robot/{robotID}/initPersonality`
- 消息和摘要：`GET /api/robot/{robotID}/message/{cursor}/{limit}`、`GET /api/robot/{robotID}/abstract/{cursor}/{limit}`
- 用户画像和家庭画像：`GET /api/robot/{robotID}/userportrait`、`GET /api/robot/{robotID}/userportrait/{portraitID}`、`GET /api/robot/{robotID}/familyportrait`

管理员登录后仍使用机器人列表页；后端会根据 token 判断 `isAdmin`，管理员可以在同一列表中看到所有机器人。

## 检查

TypeScript 检查：

```powershell
npx.cmd tsc --noEmit
```

如果 PowerShell 阻止执行 `npx.ps1`，使用 `npx.cmd`。
