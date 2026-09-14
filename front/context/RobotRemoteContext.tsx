import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { ConnectionState, RobotRemoteClient } from '@/services/RobotRemoteClient';

const ENDPOINT_KEY = 'robot.remote.endpoint';
const DEFAULT_ENDPOINT = 'ws://192.168.41.2:8765/ws';

type RobotRemoteContextValue = {
  endpoint: string;
  setEndpoint: (value: string) => void;
  connectionState: ConnectionState;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  command: <T>(action: string, params?: Record<string, unknown>) => Promise<T>;
};

const RobotRemoteContext = createContext<RobotRemoteContextValue>({} as RobotRemoteContextValue);

export function RobotRemoteProvider({ children }: React.PropsWithChildren) {
  const clientRef = useRef(new RobotRemoteClient());
  const [endpoint, setEndpointState] = useState(DEFAULT_ENDPOINT);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ENDPOINT_KEY).then(saved => saved && setEndpointState(saved));
    const client = clientRef.current;
    client.onStateChange = (nextState, nextError) => {
      setConnectionState(nextState);
      setError(nextError || null);
    };
    return () => client.disconnect();
  }, []);

  const setEndpoint = useCallback((value: string) => {
    setEndpointState(value);
    AsyncStorage.setItem(ENDPOINT_KEY, value).catch(() => undefined);
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    try {
      await clientRef.current.connect(endpoint);
      await clientRef.current.command('ping');
    } catch (connectError) {
      clientRef.current.disconnect();
      throw connectError;
    }
  }, [endpoint]);

  const disconnect = useCallback(() => clientRef.current.disconnect(), []);
  const command = useCallback(<T,>(action: string, params: Record<string, unknown> = {}) => (
    clientRef.current.command<T>(action, params)
  ), []);

  return (
    <RobotRemoteContext.Provider value={{
      endpoint,
      setEndpoint,
      connectionState,
      error,
      connect,
      disconnect,
      command,
    }}>
      {children}
    </RobotRemoteContext.Provider>
  );
}

export const useRobotRemote = () => useContext(RobotRemoteContext);
