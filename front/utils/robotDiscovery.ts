import dgram from 'react-native-udp';

const DISCOVER_PORT = 9999;
const DISCOVER_MAGIC = 'ROBOT_DISCOVER';
const DISCOVER_TIMEOUT = 3000;

export interface DiscoveredRobot {
  name: string;
  ip: string;
  ws_port: number;
}

export function discoverRobots(timeoutMs: number = DISCOVER_TIMEOUT): Promise<DiscoveredRobot[]> {
  return new Promise((resolve) => {
    const found: DiscoveredRobot[] = [];
    const seen = new Set<string>();

    const socket = dgram.createSocket({ type: 'udp4' });

    const timer = setTimeout(() => {
      try { socket.close(); } catch {}
      resolve(found);
    }, timeoutMs);

    socket.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString('utf-8'));
        if (msg.type === 'robot_announce' && msg.ip && !seen.has(msg.ip)) {
          seen.add(msg.ip);
          found.push({ name: msg.name, ip: msg.ip, ws_port: msg.ws_port });
        }
      } catch {}
    });

    socket.on('error', () => {
      clearTimeout(timer);
      try { socket.close(); } catch {}
      resolve(found);
    });

    socket.bind(0, () => {
      try {
        socket.setBroadcast(true);
        const buf = Buffer.from(DISCOVER_MAGIC, 'utf-8');
        socket.send(buf, 0, buf.length, DISCOVER_PORT, '255.255.255.255');
      } catch {
        clearTimeout(timer);
        try { socket.close(); } catch {}
        resolve(found);
      }
    });
  });
}
