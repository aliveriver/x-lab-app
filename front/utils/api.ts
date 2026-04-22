import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const API_BASE_URL = 'http://127.0.0.1:8000';

type FetchOptions = RequestInit & {
  bodyData?: any;
};

// DEMO MOCK MODE: Intercepts all backend requests and returns dummy data
export async function fetchApi(endpoint: string, options: FetchOptions = {}) {
  const method = options.method || 'GET';
  console.log(`[API MOCK] ${method} ${endpoint}`);

  // Simulate network delay for realistic UI feedback
  await new Promise(resolve => setTimeout(resolve, 600));

  // --- Auth / Token ---
  if (endpoint.includes('/api/user/token')) {
    return {
      code: 200,
      data: {
        token: 'demo-token-777',
        userID: 'demo-user-id-01'
      }
    };
  }

  // --- User Info ---
  if (endpoint.includes('/info/change')) {
    return { code: 200, data: {} };
  }
  if (endpoint.includes('/info')) {
    return {
      code: 200,
      data: {
        userID: 'demo-user-id-01',
        userName: '长城车主 (体验版)',
        phonenumber: '13888888888',
        avatar: 'default',
        isAdmin: 1,
        gender: 1,
        familyRole: '主驾',
        carModel: '哈弗 / 魏牌 (Demo)'
      }
    };
  }

  // --- Robot Config ---
  if (endpoint.endsWith('/robot')) {
    return {
      code: 200,
      data: {
        robotList: [
          { robotCode: 'copilot-greatwall-01', robotName: '小魏同学 (副驾)', toneID: 1, personalityID: 1 }
        ]
      }
    };
  }

  // --- Memory / Abstracts ---
  if (endpoint.includes('/abstract')) {
    return {
      code: 200,
      data: {
        abstractList: [
          { abstractID: 'm1', createdAt: Date.now() - 3600000, content: '记录到车主变更了导航目的地：长城汽车哈弗技术中心。' },
          { abstractID: 'm2', createdAt: Date.now() - 86400000, content: '记录到车主偏好在早间通勤时收听科技类播客。' },
          { abstractID: 'm3', createdAt: Date.now() - 172800000, content: '监测到长时间驾驶，主动触发了主驾座椅按摩功能。' }
        ]
      }
    };
  }

  // --- Memory / Messages ---
  if (endpoint.includes('/message')) {
    return {
      code: 200,
      data: {
        messageList: [
          { messageID: 'msg1', belong: 'demo-user-id-01', content: '打开空调，今天有点热。', createdAt: Date.now() - 3600000 },
          { messageID: 'msg2', belong: 'copilot-greatwall-01', content: '好的，已经为您将空调设置为 24°C，制冷模式。还要为您播放周杰伦的歌吗？', createdAt: Date.now() - 3590000 }
        ]
      }
    };
  }

  // --- Robot Persona & Tone details ---
  if (endpoint.includes('/tone') && !endpoint.includes('change')) {
    return {
      code: 200,
      data: {
        toneList: [{ toneID: 1, toneName: '柔和亲切 (女声)' }]
      }
    };
  }

  if (endpoint.includes('/initPersonality')) {
    return {
      code: 200,
      data: {
        personalityList: [{ personalityID: 1, personalityName: '贴心助手' }]
      }
    };
  }

  if (endpoint.includes('/personality') && !endpoint.includes('initPersonality') && !endpoint.includes('change')) {
    return {
      code: 200,
      data: {
        mbti: { E: 60, I: 40, S: 50, N: 50, T: 45, F: 55, J: 70, P: 30 },
        big5: {
          neuroticism: 30,
          extraversion: 60,
          openness: 40,
          agreeableness: 80,
          conscientiousness: 90
        }
      }
    };
  }

  // Generic fallback for any other endpoints (like /bind, /alias, etc)
  return {
    code: 200,
    data: [],
    msg: 'Mock Data Success'
  };
}
