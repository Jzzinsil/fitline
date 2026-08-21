// Greenhouse Job Board API — 공개용으로 문서화된 공식 엔드포인트. 인증 불필요.
// 기업이 스스로 공개 배포하는 채널이므로 스크래핑이 아니다.
import { get } from '../fetch.mjs';
import { normalize } from '../normalize.mjs';

const BOARDS = [
  { token: 'coupang',  co: '쿠팡',       type: '글로벌' },
  { token: 'krafton',  co: '크래프톤',   type: '대기업' },
  { token: 'moloco',   co: '몰로코',     type: '글로벌' },
  { token: 'sendbird', co: '샌드버드',   type: '글로벌' },
];

const KR = /korea|seoul|서울|경기|판교|한국|jamsil|잠실|gangnam/i;

export async function pull({ koreaOnly = true } = {}) {
  console.log('▶ Greenhouse 공개 Job Board API');
  const out = [];
  for (const b of BOARDS) {
    const r = await get(`https://boards-api.greenhouse.io/v1/boards/${b.token}/jobs?content=true`, { json: true });
    if (!r.ok) { console.log(`  ! ${b.co} 실패`); continue; }
    const jobs = r.body.jobs || [];
    let kept = 0;
    for (const j of jobs) {
      const loc = j.location?.name || '';
      if (koreaOnly && !KR.test(loc)) continue;
      const body = (j.content || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
                                    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
      out.push(normalize({
        source: 'gh', sourceId: String(j.id), sourceLabel: `${b.co} Greenhouse 공개 API`,
        company: b.co, title: j.title, description: body, extra: '',
        education: body, experience: body, location: loc,
        posted: j.updated_at?.slice(0, 10), type: b.type,
        foreign: b.type === '글로벌',
        team: j.departments?.[0]?.name, url: j.absolute_url,
      }));
      kept++;
    }
    console.log(`  ${b.co}: 전체 ${jobs.length}건 → 한국 근무지 ${kept}건`);
  }
  console.log(`✔ Greenhouse ${out.length}건`);
  return out;
}
