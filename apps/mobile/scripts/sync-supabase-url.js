/**
 * Syncs EXPO_PUBLIC_SUPABASE_URL, then starts Expo.
 * Probes candidates so we never bake in a dead hotspot/VPN IP.
 * - --web → 127.0.0.1
 * - otherwise → reachable LAN IP, else 127.0.0.1
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

function syncEnv(ip) {
  const url = `http://${ip}:${PORT}`;
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  if (/^EXPO_PUBLIC_SUPABASE_URL=.*/m.test(content)) {
    content = content.replace(/^EXPO_PUBLIC_SUPABASE_URL=.*/m, `EXPO_PUBLIC_SUPABASE_URL=${url}`);
  } else {
    content = `EXPO_PUBLIC_SUPABASE_URL=${url}\n${content}`;
  }

  fs.writeFileSync(envPath, content);
  console.log(`[sync-supabase-url] EXPO_PUBLIC_SUPABASE_URL=${url}`);
  if (ip !== '127.0.0.1') {
    console.log(`[sync-supabase-url] Phone and PC must share Wi-Fi ${ip}`);
  } else {
    console.log(`[sync-supabase-url] Using localhost (web / same-machine). For a physical phone, ensure LAN IP is reachable.`);
  }
  return url;
}

async function main() {
  const expoArgs = process.argv.slice(2);
  const isWeb = expoArgs.includes('--web');
  const ip = await pickReachableIp(isWeb);
  const url = syncEnv(ip);

  const child = spawn('npx', ['expo', 'start', '--lan', ...expoArgs], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      REACT_NATIVE_PACKAGER_HOSTNAME: isWeb ? undefined : ip === '127.0.0.1' ? undefined : ip,
      EXPO_PUBLIC_SUPABASE_URL: url,
      EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK: '1',
    },
  });

  child.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error('[sync-supabase-url]', err);
  process.exit(1);
});
