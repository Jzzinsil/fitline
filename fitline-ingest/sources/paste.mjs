// LinkedIn·Blind·원티드 공고를 Fitline에 넣는 합법 경로.
// 사람이 브라우저로 정상 열람한 공고를 복사해서 붙이면, 같은 정규화기를 태운다.
// 자동 수집이 아니라 수동 이관이라 약관 문제가 없다. 헤드헌터 실무에서 주 20~50건이면 충분히 감당된다.
import { normalize } from '../normalize.mjs';

export function parsePasted(text, { company, source = 'paste', url = '' } = {}) {
  const t = text.replace(/\r/g, '');
  const pick = (...pats) => { for (const p of pats) { const m = t.match(p); if (m) return m[1].trim(); } return ''; };
  return normalize({
    source, sourceId: String(Math.abs([...t].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7))),
    sourceLabel: source === 'paste' ? '수동 등록 (사람이 열람 후 이관)' : source,
    company: company || pick(/^회사(?:명)?\s*[:：]\s*(.+)$/m, /^Company\s*[:：]\s*(.+)$/mi) || '(회사명 입력 필요)',
    title: pick(/^(?:포지션|직무|제목)\s*[:：]\s*(.+)$/m, /^(?:Title|Position)\s*[:：]\s*(.+)$/mi) || t.split('\n')[0].slice(0, 80),
    description: t,
    education: pick(/학력\s*[:：]?\s*(.+)$/m) || t,
    experience: pick(/경력\s*[:：]?\s*(.+)$/m, /Experience\s*[:：]?\s*(.+)$/mi) || t,
    location: pick(/(?:근무지|지역|Location)\s*[:：]\s*(.+)$/mi),
    url, type: '미분류',
  });
}

export async function pull({ dir = 'fitline-data/pasted' } = {}) {
  const fs = await import('node:fs');
  if (!fs.existsSync(dir)) { console.log(`◌ 수동 등록 — ${dir}/ 없음 (여기에 .txt로 붙여넣으면 자동 파싱)`); return []; }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt'));
  const out = files.map(f => parsePasted(fs.readFileSync(`${dir}/${f}`, 'utf8'), { source: 'paste' }));
  console.log(`✔ 수동 등록 ${out.length}건`);
  return out;
}
