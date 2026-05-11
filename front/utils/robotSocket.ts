import { useCallback, useEffect, useRef, useState } from 'react';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface RobotMessage {
  type: string;
  id?: string;
  ok?: boolean;
  data?: any;
  event?: string;
  error?: string;
}

type MessageHandler = (msg: RobotMessage) => void;

let _reqId = 0;
function nextId(): string {
  return `req_${++_reqId}_${Date.now()}`;
}

export function useRobotConnection(robotIp: string, port: number = 8765) {
  const [state, setState] = useState<ConnectionState>('disconnected');
  const [robotInfo, setRobotInfo] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, MessageHandler>>(new Map());
  const eventListenersRef = useRef<Set<MessageHandler>>(new Set());

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setState('connecting');
    const url = `ws://${robotIp}:${port}`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setState('connected');
    };

    ws.onmessage = (event) => {
      try {
        const msg: RobotMessage = JSON.parse(event.data);

        if (msg.type === 'event' && msg.event === 'connected') {
          setRobotInfo(msg.data);
        }

        if (msg.type === 'result' && msg.id) {
          const handler = handlersRef.current.get(msg.id);
          if (handler) {
            handler(msg);
            handlersRef.current.delete(msg.id);
          }
        }

        if (msg.type === 'event') {
          eventListenersRef.current.forEach((listener) => listener(msg));
        }
      } catch (e) {
        console.error('[WS] parse error', e);
      }
    };

    ws.onerror = () => {
      setState('disconnected');
    };

    ws.onclose = () => {
      setState('disconnected');
      wsRef.current = null;
    };

    wsRef.current = ws;
  }, [robotIp, port]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setState('disconnected');
  }, []);

  const sendCommand = useCallback(
    (action: string, params: Record<string, any> = {}): Promise<RobotMessage> => {
      return new Promise((resolve, reject) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          reject(new Error('not connected'));
          return;
        }

        const id = nextId();
        const timeout = setTimeout(() => {
          handlersRef.current.delete(id);
          reject(new Error('timeout'));
        }, 10000);

        handlersRef.current.set(id, (msg) => {
          clearTimeout(timeout);
          resolve(msg);
        });

        wsRef.current.send(JSON.stringify({ type: 'command', action, params, id }));
      });
    },
    [],
  );

  const onEvent = useCallback((handler: MessageHandler) => {
    eventListenersRef.current.add(handler);
    return () => {
      eventListenersRef.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return { state, robotInfo, connect, disconnect, sendCommand, onEvent };
}
