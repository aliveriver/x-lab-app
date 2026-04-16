import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// 配置：若使用 Android 模拟器请改为 'http://10.0.2.2:8000'
// 本机测试可使用 'http://127.0.0.1:8000' 或局域网 IP
export const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';

type FetchOptions = RequestInit & {
  bodyData?: any;
};

export async function fetchApi(endpoint: string, options: FetchOptions = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 尝试携带 Token
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Failed to get token for api call', e);
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const config: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.bodyData) {
    config.body = JSON.stringify(options.bodyData);
  }

  console.log(`[API CALL] ${config.method} ${url}`);

  try {
    const response = await fetch(url, config);
    const json = await response.json();
    console.log(`[API RESP] ${config.method} ${url}`, json);
    
    // 如果返回 code 为 401 或类似未授权，可在此拦截跳转登录
    
    return json;
  } catch (error) {
    console.error(`[API ERROR] ${config.method} ${url}`, error);
    throw error;
  }
}
