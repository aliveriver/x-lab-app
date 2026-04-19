import requests
import time

BASE_URL = "http://127.0.0.1:8000/api"

# 测试账号配置 (对应 seed.py 生成的管理员)
PHONE = "18800000000"
CODE = "123456" 

# 全局变量
TOKEN = ""
USER_ID = ""
ROBOT_ID = "ROBOT-DEMO-001" # 对应 seed.py 中的测试机器人

def print_result(name, res, expected_code=200):
    """辅助打印测试结果。FastAPI 后端 R.ok() 默认 code 为 200"""
    try:
        data = res.json()
        if res.status_code == 200 and data.get("code") == expected_code:
            print(f"✅ [通过] {name}")
            return data.get("data")
        else:
            print(f"❌ [失败] {name} | HTTP状态码: {res.status_code} | 响应: {data}")
            return None
    except Exception as e:
        print(f"❌ [异常] {name} | 错误: {e} | 原始返回: {res.text}")
        return None

def get_headers():
    return {"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}

def run_tests():
    global TOKEN, USER_ID

    print("="*50)
    print(" 🚀 开始全链路自动测试 X-Lab API ")
    print("="*50)

    # --------------------------------------------------
    # 1. 用户认证
    # --------------------------------------------------
    print("\n--- 1. 用户认证 ---")
    # ⚠️ 注意这里：必须是全小写的 phonenumber (基于上一次 422 报错的推断)
    login_payload = {"phonenumber": PHONE, "code": CODE}
    login_data = print_result("用户登录获取 Token", requests.post(f"{BASE_URL}/user/token", json=login_payload))
    
    if login_data and "token" in login_data:
        TOKEN = login_data["token"]
        # 直接拿根目录的 userID
        USER_ID = login_data["userID"] 
    else:
        print("⚠️ 登录失败，请检查数据库是否存在该用户。测试终止。")
        return

    headers = get_headers()

    # --------------------------------------------------
    # 2. 机器人配置选项 (不依赖绑定关系)
    # --------------------------------------------------
    print("\n--- 2. 机器人配置候选项 ---")
    tone_data = print_result("拉取音色列表", requests.get(f"{BASE_URL}/robot/{ROBOT_ID}/tone", headers=headers))
    print_result("拉取初始人格列表", requests.get(f"{BASE_URL}/robot/{ROBOT_ID}/initPersonality", headers=headers))
    print_result("拉取技能列表", requests.get(f"{BASE_URL}/robot/{ROBOT_ID}/skill", headers=headers))

    # --------------------------------------------------
    # 3. 机器人核心状态与基础修改
    # --------------------------------------------------
    print("\n--- 3. 机器人核心数据 ---")
    print_result("获取当前人格", requests.get(f"{BASE_URL}/robot/{ROBOT_ID}/personality", headers=headers))
    
    # ⚠️ 注意：基于你的 schema，ChangePersonalityRequest 必须携带 robotID 以及完整的 mbti 和 big5，否则会报 422 拦截，测不到你的 403 逻辑
    fake_personality_payload = {
        "robotID": ROBOT_ID,
        "mbti": {"E": 50, "I": 50, "S": 50, "N": 50, "T": 50, "F": 50, "J": 50, "P": 50},
        "big5": {"neuroticism": 50, "extraversion": 50, "openness": 50, "agreeableness": 50, "conscientiousness": 50}
    }
    # 预期拿到后端的业务拦截 (code=403)
    print_result("拦截手动修改人格 (预期拦截 403)", requests.put(f"{BASE_URL}/robot/{ROBOT_ID}/personality/change", json=fake_personality_payload, headers=headers), expected_code=403)

    if tone_data and tone_data.get("toneList"):
        # 拿列表里第一个音色ID去尝试修改
        first_tone_id = tone_data["toneList"][0]["toneID"]
        # ⚠️ 注意：基于你的 ChangeToneRequest，必须带上 robotID
        tone_payload = {
            "robotID": ROBOT_ID,
            "toneID": first_tone_id
        }
        print_result("修改机器人音色", requests.put(f"{BASE_URL}/robot/{ROBOT_ID}/tone/change", json=tone_payload, headers=headers))

    # --------------------------------------------------
    # 4. 对话与记忆核心业务
    # --------------------------------------------------
    print("\n--- 4. 消息与摘要业务 ---")
    msg_payload = {
        "userID": USER_ID,
        "speakerType": "user",
        "speakerID": USER_ID,
        "content": "你好小星，今天天气怎么样？我有点感冒了。",
        "messageType": "text"
    }
    print_result("发送一条新聊天消息", requests.post(f"{BASE_URL}/robot/{ROBOT_ID}/message", json=msg_payload, headers=headers))
    
    print_result("获取消息列表 (游标分页)", requests.get(f"{BASE_URL}/robot/{ROBOT_ID}/message?cursor=0&limit=10", headers=headers))
    print_result("获取记忆摘要 (游标分页)", requests.get(f"{BASE_URL}/robot/{ROBOT_ID}/abstract?cursor=0&limit=10", headers=headers))

    # --------------------------------------------------
    # 5. 用户画像
    # --------------------------------------------------
    print("\n--- 5. 用户画像 ---")
    portrait_data = print_result("获取用户画像列表", requests.get(f"{BASE_URL}/robot/{ROBOT_ID}/userportrait", headers=headers))
    
    if portrait_data and portrait_data.get("userPortraitList") and len(portrait_data["userPortraitList"]) > 0:
        first_portrait_id = portrait_data["userPortraitList"][0]["portraitID"]
        print_result("获取单个画像详细数据", requests.get(f"{BASE_URL}/robot/{ROBOT_ID}/userportrait/{first_portrait_id}", headers=headers))

    # --------------------------------------------------
    # 6. 后台演化任务 (同步执行)
    # --------------------------------------------------
    print("\n--- 6. AI 演化任务 ---")
    print("⏳ 正在请求演化接口，因为是同步执行，这可能需要等待几秒到十几秒，请勿关闭...")
    
    start_time = time.time()
    # 阻塞请求，直到跑完返回结果
    evolve_res = requests.post(f"{BASE_URL}/robot/trigger_evolution", headers=headers)
    cost_time = time.time() - start_time
    
    print_result(f"触发并完成演化 (耗时: {cost_time:.2f}秒)", evolve_res)

    print("\n" + "="*50)
    print(" 🎉 全部测试流程结束！请检查上方是否有 ❌。")
    print("="*50)

if __name__ == "__main__":
    run_tests()