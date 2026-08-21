// 고용24(워크넷) 공공데이터 API. data.go.kr 인증키만 있으면 되고 제약이 가장 적다.
import { normalize } from '../normalize.mjs';

export async function pull({ key = process.env.WORKNET_API_KEY, rows = 100 } = {}) {
  if (!key) { console.log('◌ 워크넷 — WORKNET_API_KEY 없음. 발급: data.go.kr > 한국고용정보원 채용정보 활용신청'); return []; }
  const u = new URL('https://openapi.work.go.kr/opi/opi/opia/wantedApi.do');
  u.searchParams.set('authKey', key);
  u.searchParams.set('callTp', 'L'); u.searchParams.set('returnType', 'XML');
  u.searchParams.set('startPage', '1'); u.searchParams.set('display', String(rows));
  const r = await fetch(u);
  if (!r.ok) { console.log(`  ! 워크넷 API HTTP ${r.status}`); return []; }
  const xml = await r.text();
  const out = [];
  for (const m of xml.matchAll(/<wanted>([\s\S]*?)<\/wanted>/g)) {
    const g = t => m[1].match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`))?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || '';
    out.push(normalize({
      source: 'worknet', sourceId: g('wantedAuthNo'), sourceLabel: '고용24 공공 API',
      company: g('company'), title: g('title'), description: `${g('jobsCd')} ${g('etcItm')}`,
      education: g('minEdubg'), experience: g('career'), location: g('region'),
      closes: g('closeDt'), url: g('wantedInfoUrl'), type: '미분류',
    }));
  }
  console.log(`✔ 워크넷 ${out.length}건`);
  return out;
}
