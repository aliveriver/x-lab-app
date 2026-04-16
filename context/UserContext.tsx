import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserProfile = {
  userID: string;
  userName: string;
  phonenumber: string;
  avatar: string;
};

type UserContextType = {
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
};

const MOCK_INITIAL_USER: UserProfile = {
  userID: 'U1001',
  userName: '大工指挥官 Alpha',
  phonenumber: '13800000000',
  avatar: 'default',
};

const UserContext = createContext<UserContextType>({} as UserContextType);

export const UserProvider = ({ children }: any) => {
  const [user, setUser] = useState<UserProfile>(MOCK_INITIAL_USER);

  useEffect(() => {
    AsyncStorage.getItem('USER_PROFILE').then(data => {
      if (data) {
        setUser(JSON.parse(data));
      }
    });
  }, []);

  const updateUser = (updates: Partial<UserProfile>) => {
    const newUser = { ...user, ...updates };
    setUser(newUser);
    AsyncStorage.setItem('USER_PROFILE', JSON.stringify(newUser)).catch(err => console.log('Save Error', err));
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
