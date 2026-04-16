import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchApi } from '@/utils/api';
import { useRouter } from 'expo-router';

type UserProfile = {
  userID: string;
  userName: string;
  phonenumber: string;
  avatar: string;
  isAdmin: number;
};

type UserContextType = {
  user: UserProfile;
  loadUserInfo: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => void;
};

const EMPTY_USER: UserProfile = {
  userID: '',
  userName: '----',
  phonenumber: '',
  avatar: 'default',
  isAdmin: 0,
};

const UserContext = createContext<UserContextType>({} as UserContextType);

export const UserProvider = ({ children }: any) => {
  const [user, setUser] = useState<UserProfile>(EMPTY_USER);
  const router = useRouter();

  const loadUserInfo = async () => {
    try {
      const userID = await AsyncStorage.getItem('USER_ID');
      const token = await AsyncStorage.getItem('ACCESS_TOKEN');
      if (!userID || !token) {
        throw new Error('鉴权流失');
      }
      const data = await fetchApi(`/api/user/${userID}/info`);
      if ((data.code === 0 || data.code === 200) && data.data) {
        setUser(data.data);
      } else {
        throw new Error('同步遭拒');
      }
    } catch (e) {
      setUser(EMPTY_USER);
      router.replace('/login');
    }
  };

  useEffect(() => {
    loadUserInfo();
  }, []);

  const updateUser = async (updates: Partial<UserProfile>) => {
    if (!user.userID) return;
    try {
      const newUser = { ...user, ...updates };
      setUser(newUser);
      // PUT Request
      await fetchApi(`/api/user/${user.userID}/info/change`, {
        method: 'PUT',
        bodyData: updates
      });
    } catch (e) {
      console.error('更新回写失败', e);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('ACCESS_TOKEN');
    await AsyncStorage.removeItem('USER_ID');
    setUser(EMPTY_USER);
    router.replace('/login');
  };

  return (
    <UserContext.Provider value={{ user, loadUserInfo, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
