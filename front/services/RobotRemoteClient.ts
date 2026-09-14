/** WebSocket client for the robot's local-network control protocol. */

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

export class RobotRemoteClient {
  private socket: WebSocket | null = null;
  private pending = new Map<string, PendingRequest>();
  private sequence = 0;
  onStateChange?: (state: ConnectionState, error?: string) => void;

  async connect(endpoint: string): Promise<void> {
    this.disconnect();
    this.onStateChange?.('connecting');

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const socket = new WebSocket(normalizeEndpoint(endpoint));
      this.socket = socket;
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          socket.close();
          reject(new Error('连接超时，请确认手机与机器人在同一网络'));
        }
      }, 6000);

      socket.onopen = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        this.onStateChange?.('connected');
        resolve();
      };
      socket.onmessage = event => this.handleMessage(String(event.data));
      socket.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(new Error('无法连接机器人'));
        }
      };
      socket.onclose = () => {
        clearTimeout(timeout);
        if (this.socket === socket) this.socket = null;
        this.rejectPending('机器人连接已断开');
        this.onStateChange?.('disconnected', settled ? '机器人连接已断开' : undefined);
      };
    }).catch(error => {
      const message = error instanceof Error ? error.message : '连接失败';
      this.onStateChange?.('disconnected', message);
      throw error;
    });
  }

  disconnect(): void {
    const socket = this.socket;
    this.socket = null;
    if (socket) socket.close();
    this.rejectPending('连接已关闭');
    this.onStateChange?.('disconnected');
  }

  command<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('请先连接机器人'));
    }
    const id = `app-${Date.now()}-${++this.sequence}`;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('机器人响应超时'));
      }, 10000);
      this.pending.set(id, {
        resolve: value => resolve(value as T),
        reject,
        timer,
      });
      this.socket?.send(JSON.stringify({ type: 'command', action, params, id }));
    });
  }

  private handleMessage(raw: string): void {
    try {
      const message = JSON.parse(raw);
      if (message.type !== 'result' || !message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(message.id);
      if (message.ok) pending.resolve(message.data);
      else pending.reject(new Error(message.error || '机器人执行失败'));
    } catch {
      // Ignore malformed or unrelated event messages.
    }
  }

  private rejectPending(message: string): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error(message));
    }
    this.pending.clear();
  }
}

export function normalizeEndpoint(value: string): string {
  const trimmed = value.trim().replace(/\/$/, '');
  if (/^wss?:\/\//i.test(trimmed)) {
    return trimmed.endsWith('/ws') ? trimmed : `${trimmed}/ws`;
  }
  const withPort = trimmed.includes(':') ? trimmed : `${trimmed}:8765`;
  return `ws://${withPort}/ws`;
}
