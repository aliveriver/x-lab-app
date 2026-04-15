import React, { createContext, useState, useContext } from 'react';

type RobotType = {
  robotCode: string;
  robotName: string;
  toneID: number;
  personalityID: number;
};

type RobotContextType = {
  robots: RobotType[];
  addRobot: (r: RobotType) => void;
  updateRobotName: (code: string, newName: string) => void;
};

const RobotContext = createContext<RobotContextType>({} as RobotContextType);

export const RobotProvider = ({ children }: any) => {
  const [robots, setRobots] = useState<RobotType[]>([]);

  const addRobot = (r: RobotType) => setRobots([...robots, r]);
  
  const updateRobotName = (code: string, newName: string) => {
    setRobots(prev => prev.map(r => r.robotCode === code ? { ...r, robotName: newName } : r));
  };

  return (
    <RobotContext.Provider value={{ robots, addRobot, updateRobotName }}>
      {children}
    </RobotContext.Provider>
  );
};

export const useRobots = () => useContext(RobotContext);
