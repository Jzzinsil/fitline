// 사람인 채용정보 공식 Open API. 액세스 키 발급 후 바로 동작.
import { normalize } from '../normalize.mjs';

export async function pull({ key = process.env.SARAMIN_API_KEY, keywords = 'AI,머신러닝,데이터' } = {}) {
  if (!key) { console.log('◌ 사람인 — SARAMIN_API_KEY 없음. 발급: 사람인 개발자센터 액세스키 신청'); return []; }
  const u = new URL('https://oapi.saramin.co.kr/job-search');
  u.searchParams.set('access-key', key);
  u.searchParams.set('keywords', keywords);
  u.searchParams.set('count', '110');
  const r = await fetch(u, { headers: { Accept: 'application/json' } });
  if (!r.ok) { console.log(`  ! 사람인 API HTTP ${r.status}`); return []; }
  const d = await r.json();
  const rows = d.jobs?.job || [];
  console.log(`✔ 사람인 공식 API ${rows.length}건`);
  return rows.map(j => normalize({
    source: 'saramin', sourceId: String(j.id), sourceLabel: '사람인 Open API',
    company: j.company?.detail?.name, title: j.position?.title,
    description: `${j.position?.job_code?.name || ''} ${j.position?.industry?.name || ''}`,
    education: j.position?.required_education_level?.name,
    experience: j.position?.experience_level?.name,
    location: j.position?.location?.name, comp: null,
    posted: j.posting_timestamp, url: j.url, type: '미분류',
  }));
}
