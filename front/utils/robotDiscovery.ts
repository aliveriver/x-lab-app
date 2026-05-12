const PING_PATH = '/ping';
const SCAN_TIMEOUT = 2000;

export interface DiscoveredRobot {
  name: string;
  ip: string;
  ws_port: number;
}

export async function discoverRobots(subnetPrefix?: string, timeoutMs: number = SCAN_TIMEOUT): Promise<DiscoveredRobot[]> {
  const prefix = subnetPrefix || guessSubnet();
  if (!prefix) return [];

  const found: DiscoveredRobot[] = [];
  const batchSize = 20;

  for (let start = 1; start <= 254; start += batchSize) {
    const batch: Promise<void>[] = [];
    for (let i = start; i < Math.min(start + batchSize, 255); i++) {
      const ip = `${prefix}.${i}`;
      batch.push(
        probeHost(ip, timeoutMs)
          .then((robot) => { if (robot) found.push(robot); })
          .catch(() => {})
      );
    }
    await Promise.all(batch);
    if (found.length > 0) break;
  }

  return found;
}

async function probeHost(ip: string, timeoutMs: number): Promise<DiscoveredRobot | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(`http://${ip}:8765${PING_PATH}`, { signal: controller.signal });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.ok && data.name) {
      return { name: data.name, ip, ws_port: data.ws_port || 8765 };
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function guessSubnet(): string {
  return '';
}

export function discoverByIpHint(ip: string, timeoutMs: number = SCAN_TIMEOUT): Promise<DiscoveredRobot[]> {
  const parts = ip.split('.');
  if (parts.length === 4) {
    const prefix = parts.slice(0, 3).join('.');
    return discoverRobots(prefix, timeoutMs);
  }
  return Promise.resolve([]);
}
