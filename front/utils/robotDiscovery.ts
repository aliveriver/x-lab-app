const PING_PATH = '/ping';
const SCAN_TIMEOUT = 3000;

export interface DiscoveredRobot {
  name: string;
  ip: string;
  ws_port: number;
}

export function discoverByIpHint(ip: string, timeoutMs: number = SCAN_TIMEOUT): Promise<DiscoveredRobot[]> {
  const parts = ip.replace(/\.$/, '').split('.').filter(Boolean);
  if (parts.length >= 3) {
    const prefix = parts.slice(0, 3).join('.');
    return scanSubnet(prefix, timeoutMs);
  }
  return Promise.resolve([]);
}

async function scanSubnet(prefix: string, timeoutMs: number): Promise<DiscoveredRobot[]> {
  const found: DiscoveredRobot[] = [];

  const promises = Array.from({ length: 254 }, (_, i) => {
    const ip = `${prefix}.${i + 1}`;
    return probeHost(ip, timeoutMs)
      .then((robot) => { if (robot) found.push(robot); })
      .catch(() => {});
  });

  await Promise.all(promises);
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
