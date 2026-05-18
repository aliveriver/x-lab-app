const PING_PATH = '/ping';
const PROBE_TIMEOUT = 2000;

export interface DiscoveredRobot {
  name: string;
  ip: string;
  ws_port: number;
}

export async function discoverByIpHint(ip: string, _timeoutMs?: number): Promise<DiscoveredRobot[]> {
  const parts = ip.replace(/\.$/, '').split('.').filter(Boolean);
  if (parts.length < 3) return [];

  const prefix = parts.slice(0, 3).join('.');

  // If user already typed 4 segments, probe that specific IP first
  if (parts.length === 4) {
    const exact = await probeHost(`${prefix}.${parts[3]}`, PROBE_TIMEOUT);
    if (exact) return [exact];
  }

  // Scan in small batches, prioritizing common DHCP ranges
  // Most hotspots assign from high numbers (100+) or low (2-50)
  const order = buildScanOrder();
  const found: DiscoveredRobot[] = [];
  const BATCH = 10;

  for (let i = 0; i < order.length; i += BATCH) {
    const batch = order.slice(i, i + BATCH).map((n) =>
      probeHost(`${prefix}.${n}`, PROBE_TIMEOUT)
        .then((r) => { if (r) found.push(r); })
        .catch(() => {})
    );
    await Promise.all(batch);
    if (found.length > 0) return found;
  }

  return found;
}

function buildScanOrder(): number[] {
  // Prioritize ranges where DHCP typically assigns:
  // hotspot: 46, 100-200, 2-45, 201-254
  const order: number[] = [];
  for (let i = 100; i <= 200; i++) order.push(i);
  for (let i = 2; i <= 99; i++) order.push(i);
  for (let i = 201; i <= 254; i++) order.push(i);
  order.push(1);
  return order;
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
