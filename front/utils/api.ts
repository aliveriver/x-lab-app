import {
  MOCK_USER,
  MOCK_ROBOTS,
  MOCK_TONES,
  MOCK_PERSONALITIES,
  MOCK_PERSONALITY_DATA,
  MOCK_MESSAGES,
  MOCK_ABSTRACTS,
  MOCK_FAMILY_PORTRAIT,
  MOCK_USER_PORTRAITS,
  MOCK_USER_PORTRAIT_DETAIL,
} from './mockData';

export const API_BASE_URL = 'mock://local';

type FetchOptions = RequestInit & {
  bodyData?: any;
};

const ok = (data: any) => ({ code: 200, data });

let mockRobots = [...MOCK_ROBOTS];

export async function fetchApi(endpoint: string, options: FetchOptions = {}): Promise<any> {
  const method = (options.method || 'GET').toUpperCase();
  console.log(`[MOCK API] ${method} ${endpoint}`);

  await new Promise(r => setTimeout(r, 100));

  // Auth
  if (endpoint === '/api/user/token' && method === 'POST') {
    return ok({ token: 'mock-token', userID: MOCK_USER.userID });
  }

  // User info
  if (endpoint.match(/\/api\/user\/.+\/info$/) && method === 'GET') {
    return ok(MOCK_USER);
  }
  if (endpoint.match(/\/api\/user\/.+\/info\/change/) && method === 'PUT') {
    return ok(null);
  }

  // Robot list
  if (endpoint.match(/\/api\/user\/.+\/robot$/) && method === 'GET') {
    return ok({ robotList: mockRobots });
  }

  // Bind robot
  if (endpoint === '/api/user/robot/bind' && method === 'POST') {
    const body = options.bodyData;
    if (body) {
      mockRobots.push({
        robotCode: body.robotID,
        robotName: body.robotName,
        toneID: body.toneID,
        personalityID: body.personalityID,
      });
    }
    return ok(null);
  }

  // Update robot alias
  if (endpoint === '/api/user/robot/alias' && method === 'PUT') {
    const body = options.bodyData;
    if (body) {
      mockRobots = mockRobots.map(r =>
        r.robotCode === body.robotID ? { ...r, robotName: body.robotAlias } : r
      );
    }
    return ok(null);
  }

  // Tone list
  if (endpoint.match(/\/api\/robot\/.+\/tone$/) && method === 'GET') {
    return ok({ toneList: MOCK_TONES });
  }

  // Change tone
  if (endpoint.match(/\/api\/robot\/.+\/tone\/change/) && method === 'PUT') {
    return ok(null);
  }

  // Init personality list
  if (endpoint.match(/\/api\/robot\/.+\/initPersonality/) && method === 'GET') {
    return ok({ personalityList: MOCK_PERSONALITIES });
  }

  // Robot personality data
  if (endpoint.match(/\/api\/robot\/.+\/personality$/) && method === 'GET') {
    return ok(MOCK_PERSONALITY_DATA);
  }

  // Messages
  if (endpoint.match(/\/api\/robot\/.+\/message/) && method === 'GET') {
    return ok({ messageList: MOCK_MESSAGES });
  }

  // Abstracts
  if (endpoint.match(/\/api\/robot\/.+\/abstract/) && method === 'GET') {
    return ok({ abstractList: MOCK_ABSTRACTS });
  }

  // Family portrait
  if (endpoint.match(/\/api\/robot\/.+\/familyportrait/) && method === 'GET') {
    return ok({ familyPortrait: MOCK_FAMILY_PORTRAIT });
  }

  // User portrait list
  if (endpoint.match(/\/api\/robot\/.+\/userportrait$/) && method === 'GET') {
    return ok({ userPortraitList: MOCK_USER_PORTRAITS });
  }

  // User portrait detail
  if (endpoint.match(/\/api\/robot\/.+\/userportrait\/.+/) && method === 'GET') {
    return ok(MOCK_USER_PORTRAIT_DETAIL);
  }

  console.warn(`[MOCK API] Unhandled: ${method} ${endpoint}`);
  return ok(null);
}
