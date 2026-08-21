// robots 게이트를 통과한 요청만, 도메인별 rate limit을 지켜서 보낸다.
import { allowed, UA } from './robots.mjs';

const last = new Map();
const MIN_GAP_MS = 1200;                 // 도메인당 최소 간격
export const stats = { sent: 0, blocked: 0, failed: 0, blockLog: [] };

const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function get(url, { json = false, retries = 2 } = {}) {
  const gate = await allowed(url);
  if (!gate.ok) {
    stats.blocked++;
    stats.blockLog.push({ url, why: gate.why });
    return { ok: false, blocked: true, why: gate.why };
  }
  const host = new URL(url).host;
  const wait = (last.get(host) ?? 0) + MIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  last.set(host, Date.now());

  for (let a = 0; a <= retries; a++) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' },
        signal: AbortSignal.timeout(25000),
      });
      if (r.status === 429 || r.status >= 500) { await sleep(2000 * (a + 1)); continue; }
      if (!r.ok) { stats.failed++; return { ok: false, status: r.status }; }
      stats.sent++;
      return { ok: true, body: json ? await r.json() : await r.text(), status: r.status };
    } catch (e) {
      if (a === retries) { stats.failed++; return { ok: false, error: e.message }; }
      await sleep(1500 * (a + 1));
    }
  }
  stats.failed++;
  return { ok: false };
}
