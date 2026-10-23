/**
 * Starts Expo with the right EXPO_PUBLIC_SUPABASE_URL.
 *
 * - Hosted (https://*.supabase.co): uses .env as-is; does not rewrite the file.
 * - Local (http://…:54321): probes LAN/localhost and syncs .env for Expo Go on a phone.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');
const PORT = 54321;

function isSkippedAdapter(name) {
  const lower = name.toLowerCase();
  return (
    lower.includes('vethernet') ||
    lower.includes('wsl') ||
    lower.includes('hyper-v') ||
    lower.includes('virtual') ||
    lower.includes('vpn') ||
    lower.includes('bluetooth') ||
    lower.includes('loopback') ||
    lower.includes('privado') ||
    lower.includes('openvpn')
  );
}

function listLanIps() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const [name, entries] of Object.entries(nets)) {
    if (!entries || isSkippedAdapter(name)) continue;
    const lower = name.toLowerCase();

    for (const net of entries) {
      if (net.family !== 'IPv4' || net.internal) continue;
      const ip = net.address;
      if (ip.startsWith('169.254.')) continue;
      // iPhone personal hotspot range — often not reachable for local Docker
      if (ip.startsWith('172.20.10.')) continue;

      const wifiBonus =
        lower.includes('wi-fi') || lower.includes('wifi') || lower.includes('wlan') ? -1 : 0;
      const prefer =
        ip.startsWith('192.168.') || ip.startsWith('10.')
          ? 0 + wifiBonus
          : /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
            ? 1 + wifiBonus
            : 2 + wifiBonus;

      candidates.push({ ip, prefer, name });
    }
  }

  candidates.sort((a, b) => a.prefer - b.prefer || a.ip.localeCompare(b.ip));
  return candidates.map((c) => c.ip);
}

function readEnvSupabaseUrl() {
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf8');
  let last = null;
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^EXPO_PUBLIC_SUPABASE_URL=(.*)$/);
    if (match) {
      last = match[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  return last;
}

function isHostedSupabaseUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && /\.supabase\.(co|in)$/.test(u.hostname);
  } catch {
    return false;
  }
}

function probeSupabase(ip, timeoutMs = 1200) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        host: ip,
        port: PORT,
        path: '/rest/v1/',
        timeout: timeoutMs,
        headers: { apikey: 'probe' },
      },
      (res) => {
        res.resume();
        resolve(res.statusCode != null && res.statusCode < 500);
      },
    );
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

async function pickReachableIp(preferLocalhost) {
  if (preferLocalhost) {
    if (await probeSupabase('127.0.0.1')) return '127.0.0.1';
  }

  for (const ip of listLanIps()) {
    if (await probeSupabase(ip)) return ip;
  }

  if (await probeSupabase('127.0.0.1')) return '127.0.0.1';
  return '127.0.0.1';
}

function pickPackagerHostname(isWeb) {
  if (isWeb) return undefined;
  const ips = listLanIps();
  return ips.length > 0 ? ips[0] : undefined;
}

function syncLocalEnv(ip) {
  const url = `http://${ip}:${PORT}`;
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const lines = content.split('\n');
  const out = [];
  let inserted = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('EXPO_PUBLIC_SUPABASE_URL=') && !trimmed.startsWith('#')) {
      if (!inserted) {
        out.push(`EXPO_PUBLIC_SUPABASE_URL=${url}`);
        inserted = true;
      }
      continue;
    }
    out.push(line);
  }

  if (!inserted) {
    out.unshift(`EXPO_PUBLIC_SUPABASE_URL=${url}`);
  }

  fs.writeFileSync(envPath, out.join('\n'));
  console.log(`[sync-supabase-url] Local Supabase → EXPO_PUBLIC_SUPABASE_URL=${url}`);
  if (ip !== '127.0.0.1') {
    console.log(`[sync-supabase-url] Phone and PC must share Wi-Fi (${ip})`);
  } else {
    console.log(
      `[sync-supabase-url] Using localhost (web / same-machine). For a physical phone, ensure LAN IP is reachable.`,
    );
  }
  return url;
}

async function main() {
  const expoArgs = process.argv.slice(2);
  const isWeb = expoArgs.includes('--web');
  const configured = readEnvSupabaseUrl();

  let supabaseUrl;
  let packagerHostname;

  if (isHostedSupabaseUrl(configured)) {
    supabaseUrl = configured;
    packagerHostname = pickPackagerHostname(isWeb);
    console.log(`[sync-supabase-url] Hosted Supabase (unchanged): ${supabaseUrl}`);
    if (packagerHostname) {
      console.log(`[sync-supabase-url] Expo packager LAN: ${packagerHostname}`);
    }
  } else {
    const ip = await pickReachableIp(isWeb);
    supabaseUrl = syncLocalEnv(ip);
    packagerHostname = isWeb ? undefined : ip === '127.0.0.1' ? undefined : ip;
  }

  const child = spawn('npx', ['expo', 'start', '--lan', ...expoArgs], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      REACT_NATIVE_PACKAGER_HOSTNAME: packagerHostname,
      EXPO_PUBLIC_SUPABASE_URL: supabaseUrl,
      EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK: '1',
    },
  });

  child.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error('[sync-supabase-url]', err);
  process.exit(1);
});
