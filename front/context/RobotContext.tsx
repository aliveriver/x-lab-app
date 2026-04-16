import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchApi } from '@/utils/api';
import { useUser } from './UserContext';

type RobotType = {
  robotCode: string; // The backend uses robotCode
  robotName: string;
};

type RobotContextType = {
  robots: RobotType[];
  addRobot: (robotID: string, personalityID: number, toneID: number) => Promise<void>;
  updateRobotName: (code: string, newName: string) => void;
  loadRobots: () => Promise<void>;
};

const RobotContext = createContext<RobotContextType>({} as RobotContextType);

export const RobotProvider = ({ children }: any) => {
  const [robots, setRobots] = useState<RobotType[]>([]);
  const { user } = useUser();

  const loadRobots = async () => {
    if (!user.userID) return;
    try {
      const data = await fetchApi(`/api/user/${user.userID}/robot`);
      if ((data.code === 0 || data.code === 200) && data.data?.robotList) {
        setRobots(data.data.robotList);
      }
    } catch (e) {
      console.error('Failed fetching bound robots', e);
    }
  };

  useEffect(() => {
    loadRobots();
  }, [user.userID]);

  const addRobot = async (robotID: string, personalityID: number, toneID: number) => {
    if (!user.userID) return;
    await fetchApi(`/api/user/robot/bind`, {
      method: 'POST',
      bodyData: {
        userID: user.userID,
        robotID,
        personalityID,
        toneID
      }
    });
    await loadRobots(); // Refresh list after successful bind
  };
  
  const updateRobotName = async (code: string, newName: string) => {
    if (!user.userID) return;
    
    // 乐观本地更新 UI
    setRobots(prev => prev.map(r => r.robotCode === code ? { ...r, robotName: newName } : r));

    try {
      await fetchApi(`/api/user/robot/alias`, {
        method: 'PUT',
        bodyData: {
          userID: user.userID,
          robotID: code,
          robotAlias: newName
        }
      });
    } catch (e) {
      console.error('Failed to update robot alias on server', e);
      // Optional: rollback on error
    }
  };

  return (
    <RobotContext.Provider value={{ robots, addRobot, updateRobotName, loadRobots }}>
      {children}
    </RobotContext.Provider>
  );
};

export const useRobots = () => useContext(RobotContext);
