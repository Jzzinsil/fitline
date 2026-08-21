// 잡플래닛. robots.txt에 AI 크롤러 전용 차단은 없고 User-agent:* 규칙이 적용된다.
// Disallow: /search /apply /profile /users /common /info /wizard/ /companies/*/salaries_of_job_rank/
// → 공고·기업 페이지는 막혀 있지 않다. 각 URL은 fetch.mjs의 robots 게이트가 개별 판정한다.
import { get } from '../fetch.mjs';
import { normalize } from '../normalize.mjs';

const B = 'https://www.jobplanet.co.kr';
const strip = h => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
                    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export async function pull({ pages = 2 } = {}) {
  console.log('▶ 잡플래닛 — robots 게이트가 URL별로 판정');
  const out = [];
  for (let p = 1; p <= pages; p++) {
    const r = await get(`${B}/job/search?page=${p}`);
    if (!r.ok) { console.log(`  ${r.blocked ? '✖ robots 차단' : `! HTTP ${r.status || r.error}`}: ${r.why || ''}`); break; }
    const ids = new Set([...r.body.matchAll(/\/job_postings\/(\d+)/g)].map(m => m[1]));
    console.log(`  p${p}: 공고 ID ${ids.size}건`);
    for (const id of [...ids].slice(0, 25)) {
      const d = await get(`${B}/job_postings/${id}`);
      if (!d.ok) continue;
      const text = strip(d.body);
      const co = d.body.match(/<title>([^<|]+)/)?.[1]?.trim() || '';
      out.push(normalize({
        source: 'jp', sourceId: id, sourceLabel: '잡플래닛',
        company: co.split(/[-–]/)[0].trim(), title: co, description: text.slice(0, 3000),
        education: text, experience: text, location: '', type: '미분류',
        url: `${B}/job_postings/${id}`,
      }));
    }
  }
  console.log(`${out.length ? '✔' : '◌'} 잡플래닛 ${out.length}건`);
  return out;
}
