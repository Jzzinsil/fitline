// 잡코리아. robots.txt가 AI 크롤러에 명시 허용한 경로만 사용:
//   Allow: /recruit/joblist   Allow: /Recruit/GI_Read
// 검색(/Search)·회원(/user)·기업관리(/corp) 경로는 Disallow이므로 건드리지 않는다.
import { get } from '../fetch.mjs';
import { normalize } from '../normalize.mjs';

const B = 'https://www.jobkorea.co.kr';
const strip = h => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
                    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
                    .replace(/\s+/g, ' ').trim();

function ldJson(html, type) {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const d = JSON.parse(m[1].trim());
      if (String(d['@type'] || '').includes(type)) return d;
    } catch {}
  }
  return null;
}

export async function collectIds({ dutyCtgr = 10031, pages = 3 } = {}) {
  const ids = new Set();
  // robots.txt가 AI 크롤러에 명시 허용한 AI 전용 섹션부터. (/recruit/ai-jobs/search 는 Disallow라 제외)
  for (const aiUrl of [`${B}/recruit/ai-jobs`, `${B}/recruit/ai-jobs?page=2`]) {
    const a = await get(aiUrl);
    if (!a.ok) { console.log(`  ! ai-jobs ${a.why || a.status || a.error}`); break; }
    const b4 = ids.size;
    for (const m of a.body.matchAll(/GI_Read\/(\d+)/g)) ids.add(m[1]);
    console.log(`  ai-jobs: +${ids.size - b4}건 (누적 ${ids.size})`);
  }
  for (let p = 1; p <= pages; p++) {
    const url = `${B}/recruit/joblist?menucode=duty&dutyCtgr=${dutyCtgr}${p > 1 ? `&Page_No=${p}` : ''}`;
    const r = await get(url);
    if (!r.ok) { console.log(`  ! joblist p${p} 실패 ${r.why || r.status || r.error}`); break; }
    const before = ids.size;
    for (const m of r.body.matchAll(/GI_Read\/(\d+)/g)) ids.add(m[1]);
    console.log(`  joblist p${p}: +${ids.size - before}건 (누적 ${ids.size})`);
    if (ids.size === before) break;   // 더 이상 새 공고 없음
  }
  return [...ids];
}

export async function fetchOne(id) {
  const r = await get(`${B}/Recruit/GI_Read/${id}`);
  if (!r.ok) return null;
  const html = r.body;
  const ld = ldJson(html, 'JobPosting');
  if (!ld) return null;
  const text = strip(html);
  // 조건 영역 (경력/학력/우대조건) — ld+json에 없는 세부는 본문에서 회수
  const cond = text.match(/지원자격[\s\S]{0,600}/)?.[0] || '';
  const pref = text.match(/우대조건[\s\S]{0,300}/)?.[0] || '';
  const foreign = /외국계/.test(text);
  return normalize({
    source: 'jk', sourceId: id, sourceLabel: '잡코리아 (robots 허용 경로)',
    company: (ld.hiringOrganization?.name || '').trim(),
    title: ld.title, description: `${cond} ${pref}`,
    extra: text.slice(0, 4000),
    education: ld.educationRequirements, experience: ld.experienceRequirements,
    location: (ld.jobLocation?.address?.streetAddress || '').split(' ').slice(0, 3).join(' '),
    posted: ld.datePosted, closes: ld.validThrough,
    foreign, type: foreign ? '글로벌' : '미분류',
    url: ld.url || `${B}/Recruit/GI_Read/${id}`,
  });
}

export async function pull({ pages = 3, max = 120 } = {}) {
  console.log('▶ 잡코리아 — robots 허용 경로(/recruit/joblist, /Recruit/GI_Read)만 사용');
  const ids = await collectIds({ pages });
  const out = [];
  for (const id of ids.slice(0, max)) {
    const j = await fetchOne(id);
    if (j && j.co) out.push(j);
    if (out.length % 20 === 0 && out.length) console.log(`  상세 ${out.length}건 파싱`);
  }
  console.log(`✔ 잡코리아 ${out.length}건`);
  return out;
}
