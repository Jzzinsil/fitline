// robots.txt 파서 + 게이트. 모든 요청은 이 게이트를 통과해야 나간다.
const cache = new Map();

export const UA = 'Fitline-Ingest/0.1 (+ko-headhunter matching; respects robots.txt)';
// robots.txt에서 우리에게 적용되는 그룹들. 가장 제한적인 규칙을 따른다.
const MY_TOKENS = ['fitline-ingest', 'claudebot', 'claude-web', 'anthropic-ai', '*'];

function parse(txt) {
  const groups = [];
  let cur = null, pendingAgents = [];
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim().toLowerCase();
    const v = line.slice(i + 1).trim();
    if (k === 'user-agent') {
      if (cur) { groups.push(cur); cur = null; }
      pendingAgents.push(v.toLowerCase());
    } else if (k === 'allow' || k === 'disallow') {
      if (!cur) { cur = { agents: pendingAgents, rules: [] }; pendingAgents = []; }
      if (v) cur.rules.push({ allow: k === 'allow', path: v });
      else if (k === 'disallow') cur.rules.push({ allow: true, path: '/' }); // 빈 Disallow = 전체 허용
    }
  }
  if (cur) groups.push(cur);
  return groups;
}

// robots.txt 경로 매칭: * 와일드카드, $ 종결자 지원
function matches(pattern, path) {
  const anchored = pattern.endsWith('$');
  const p = anchored ? pattern.slice(0, -1) : pattern;
  const rx = new RegExp('^' + p.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + (anchored ? '$' : ''));
  return rx.test(path);
}

export async function loadRobots(origin) {
  if (cache.has(origin)) return cache.get(origin);
  let groups = [];
  let status = 'ok';
  try {
    const r = await fetch(origin + '/robots.txt', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    if (r.ok) groups = parse(await r.text());
    else status = `robots.txt HTTP ${r.status}`;      // 읽을 수 없으면 허가 미확립
  } catch (e) { status = `robots.txt 요청 실패: ${e.message}`; }
  const rec = { groups, status };
  cache.set(origin, rec);
  return rec;
}

// 우리에게 적용되는 모든 그룹의 규칙을 합치고, 최장 일치 규칙을 채택 (robots.txt 표준)
export async function allowed(url) {
  const u = new URL(url);
  const { groups, status } = await loadRobots(u.origin);
  if (status !== 'ok') return { ok: false, why: status };

  const mine = groups.filter(g => g.agents.some(a => MY_TOKENS.includes(a)));
  if (!mine.length) return { ok: true, why: 'no matching group → 기본 허용' };

  const path = u.pathname + (u.search || '');
  let best = null;
  for (const g of mine) for (const r of g.rules) {
    if (!matches(r.path, path)) continue;
    // 같은 길이면 Disallow 우선(보수적), 더 길면 교체
    if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && !r.allow)) best = r;
  }
  if (!best) return { ok: true, why: '해당 규칙 없음 → 허용' };
  return { ok: best.allow, why: `${best.allow ? 'Allow' : 'Disallow'}: ${best.path}` };
}
