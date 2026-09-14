import React, { createContext, useState, useContext, useEffect } from 'react';
import { MOCK_USER } from '@/utils/mockData';
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

const UserContext = createContext<UserContextType>({} as UserContextType);

export const UserProvider = ({ children }: any) => {
  const [user, setUser] = useState<UserProfile>(MOCK_USER);
  const router = useRouter();

  const loadUserInfo = async () => {
    setUser(MOCK_USER);
  };

  useEffect(() => {
    loadUserInfo();
  }, []);

  const updateUser = async (updates: Partial<UserProfile>) => {
    if (!user.userID) return;
    const newUser = { ...user, ...updates };
    setUser(newUser);
  };

  const logout = () => {
    router.replace('/login');
  };

  return (
    <UserContext.Provider value={{ user, loadUserInfo, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
