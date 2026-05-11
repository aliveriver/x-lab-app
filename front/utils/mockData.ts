export const MOCK_USER = {
  userID: 'mock-user-001',
  userName: '操控员',
  phonenumber: '13800000000',
  avatar: 'default',
  isAdmin: 1,
};

export const MOCK_ROBOTS = [
  { robotCode: 'ROBOT-001', robotName: '阿尔法', toneID: 1, personalityID: 1 },
  { robotCode: 'ROBOT-002', robotName: '贝塔', toneID: 2, personalityID: 2 },
];

export const MOCK_TONES = [
  { toneID: 1, toneName: '温柔女声' },
  { toneID: 2, toneName: '磁性男声' },
  { toneID: 3, toneName: '活泼童声' },
  { toneID: 4, toneName: '沉稳长者' },
];

export const MOCK_PERSONALITIES = [
  { personalityID: 1, personalityName: '开朗外向' },
  { personalityID: 2, personalityName: '沉稳内敛' },
  { personalityID: 3, personalityName: '幽默风趣' },
];

export const MOCK_PERSONALITY_DATA = {
  mbti: { E: 65, I: 35, S: 40, N: 60, T: 55, F: 45, J: 50, P: 50 },
  big5: {
    neuroticism: 30,
    extraversion: 70,
    openness: 80,
    agreeableness: 65,
    conscientiousness: 55,
  },
};

export const MOCK_MESSAGES = [
  { messageID: 'm1', createdAt: Date.now() - 3600000, content: '你好，今天感觉怎么样？', belong: 'mock-user-001' },
  { messageID: 'm2', createdAt: Date.now() - 3500000, content: '我很好！今天天气不错，要不要出去走走？', belong: 'ROBOT-001' },
  { messageID: 'm3', createdAt: Date.now() - 3400000, content: '好主意，去公园吧。', belong: 'mock-user-001' },
  { messageID: 'm4', createdAt: Date.now() - 3300000, content: '公园是个好选择，我来帮你规划路线。', belong: 'ROBOT-001' },
];

export const MOCK_ABSTRACTS = [
  { abstractID: 'a1', createdAt: Date.now() - 86400000, content: '用户与机器人进行了日常问候，讨论了天气和出行计划。整体氛围轻松愉快。' },
  { abstractID: 'a2', createdAt: Date.now() - 172800000, content: '用户询问了机器人关于健康饮食的建议，机器人提供了营养搭配方案。' },
];

export const MOCK_FAMILY_PORTRAIT = {
  familyID: 'f1',
  createdAt: Date.now() - 604800000,
  updatedAt: Date.now() - 86400000,
  content: '这是一个温馨的三口之家，父母关注孩子的教育和健康成长。家庭氛围和谐，成员之间沟通频繁。',
};

export const MOCK_USER_PORTRAITS = [
  { portraitID: 'p1', avatar: 'default' },
  { portraitID: 'p2', avatar: 'default' },
];

export const MOCK_USER_PORTRAIT_DETAIL = {
  portraitID: 'p1',
  avatar: 'default',
  createdAt: Date.now() - 604800000,
  updatedAt: Date.now() - 86400000,
  userName: '用户A',
  age: 28,
  profession: '工程师',
  familyTies: '父亲',
  mbti: { E: 55, I: 45, S: 60, N: 40, T: 45, F: 55, J: 60, P: 40 },
  big5: {
    neuroticism: 25,
    extraversion: 60,
    openness: 70,
    agreeableness: 75,
    conscientiousness: 65,
  },
};
