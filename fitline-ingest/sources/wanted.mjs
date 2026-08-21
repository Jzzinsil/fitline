// 원티드 — 스크래핑 안 함. robots.txt 자체가 CloudFront 403으로 막혀 있어
// "허가받았다"고 말할 근거가 없다. 엣지 차단을 우회하는 건 회피 행위라 하지 않는다.
// 대신 공식 파트너 API 어댑터. WANTED_API_KEY 넣으면 바로 돈다.
import { normalize } from '../normalize.mjs';

export async function pull({ key = process.env.WANTED_API_KEY } = {}) {
  if (!key) {
    console.log('◌ 원티드 — 파트너 API 키 없음 (WANTED_API_KEY). 스크래핑은 하지 않음. 신청: 원티드랩 파트너 문의');
    return [];
  }
  const r = await fetch('https://openapi.wanted.jobs/v1/jobs?limit=100', {
    headers: { 'wanted-client-id': key, Accept: 'application/json' },
  });
  if (!r.ok) { console.log(`  ! 원티드 API HTTP ${r.status} — 키/엔드포인트 확인 필요`); return []; }
  const d = await r.json();
  const rows = d.data || d.jobs || [];
  console.log(`✔ 원티드 공식 API ${rows.length}건`);
  return rows.map(j => normalize({
    source: 'wanted', sourceId: String(j.id), sourceLabel: '원티드 공식 API',
    company: j.company?.name, title: j.position || j.title,
    description: [j.detail?.requirements, j.detail?.main_tasks, j.detail?.preferred_points].filter(Boolean).join('\n'),
    education: '', experience: `${j.annual_from ?? ''}~${j.annual_to ?? ''}년`,
    location: j.address?.location, type: '미분류', url: j.url,
  }));
}
