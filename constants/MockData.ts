export const MOCK_TONES = [
  { toneID: 1, toneName: '青年学者' },
  { toneID: 2, toneName: '温柔贴心' },
  { toneID: 3, toneName: '严厉导师' },
  { toneID: 4, toneName: '赛博系统' },
];

export const MOCK_PERSONALITIES = [
  { personalityID: 1, personalityName: '冷静分析' },
  { personalityID: 2, personalityName: '幽默风趣' },
  { personalityID: 3, personalityName: '活力满满' },
  { personalityID: 4, personalityName: '孤高冷傲' },
];

export const MOCK_ROBOT_DETAILS = {
  mbti: { E: 45, I: 55, S: 20, N: 80, T: 60, F: 40, J: 70, P: 30 },
  big5: {
    neuroticism: 30,
    extraversion: 40,
    openness: 85,
    agreeableness: 60,
    conscientiousness: 75,
  }
};

export const MOCK_MESSAGES = [
  { messageID: 'm1', createdAt: Date.now() - 3600000, content: '你好，终端初始化链接已稳定。需要执行首次诊断协议吗？', belong: 'ROBOT' },
  { messageID: 'm2', createdAt: Date.now() - 3500000, content: '暂时跳过诊断。请查询当前的系统负载情况，同时开启休眠节电模式，等待下一次指令。', belong: 'USER' },
  { messageID: 'm3', createdAt: Date.now() - 3400000, content: '系统负载极低，核心温度正常；已成功为您录入「休眠」指令序列。有新动向我会即刻唤醒告知。', belong: 'ROBOT' },
  { messageID: 'm4', createdAt: Date.now() - 3000000, content: '干得不错。帮我记录一下，明天早上9点进行数据核心迭代维护，记得提醒我。', belong: 'USER' },
  { messageID: 'm5', createdAt: Date.now() - 2900000, content: '已生成备忘录【核心维护任务】，定时任务模块将在09:00准时触发广播。', belong: 'ROBOT' },
];

export const MOCK_ABSTRACTS = [
  { abstractID: 'a1', createdAt: Date.now() - 86400000, content: '【任务记录】 用户首次接入终端系统，并成功下达了节电休眠的复合控制指令，主脑响应极快且顺利完成配置存储。' },
  { abstractID: 'a2', createdAt: Date.now() - 86400000 * 2, content: '【系统档案】 机器人经历了一次深度的人格序列覆写操作，当前正在逐渐适应并生成新的交互情绪映射表。' },
];

export const MOCK_FAMILY_PORTRAIT = {
  familyID: 'F9001',
  createdAt: Date.now() - 86400000 * 30,
  updatedAt: Date.now() - 3600000,
  content: '核心家庭结构稳定。主要交互源偏向晚间休闲活动，周末时段常有群体活动记录。家庭整体展现出高协作性和开明的氛围特质。'
};

export const MOCK_USER_PORTRAITS = [
  {
    portraitID: 'UP1001',
    avatar: 'default',
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 3600000,
    userName: '核心管理员 Z',
    age: 28,
    profession: '量子架构师',
    familyTies: '户主本人',
    mbti: { E: 80, I: 20, S: 10, N: 90, T: 85, F: 15, J: 60, P: 40 },
    big5: {
      neuroticism: 25,
      extraversion: 75,
      openness: 90,
      agreeableness: 55,
      conscientiousness: 80
    }
  },
  {
    portraitID: 'UP1002',
    avatar: 'default',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 7200000,
    userName: '见习工程师 Y',
    age: 24,
    profession: '数据分析实习生',
    familyTies: '直系学徒',
    mbti: { E: 40, I: 60, S: 30, N: 70, T: 45, F: 55, J: 35, P: 65 },
    big5: {
      neuroticism: 60,
      extraversion: 35,
      openness: 65,
      agreeableness: 80,
      conscientiousness: 40
    }
  }
];
