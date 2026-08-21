// Fitline 공고 수집 실행기.
// 원칙: robots.txt가 허용한 것만, 도메인당 1.2초 간격으로, 근거를 남기고 가져온다.
import fs from 'node:fs';
import { stats } from './fetch.mjs';
import * as jobkorea   from './sources/jobkorea.mjs';
import * as greenhouse from './sources/greenhouse.mjs';
import * as jobplanet  from './sources/jobplanet.mjs';
import * as wanted     from './sources/wanted.mjs';
import * as saramin    from './sources/saramin.mjs';
import * as worknet    from './sources/worknet.mjs';
import * as linkedin   from './sources/linkedin.mjs';
import * as blind      from './sources/blind.mjs';
import * as paste      from './sources/paste.mjs';

const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
const run  = n => !only.length || only.includes(n);

const t0 = Date.now();
const jobs = [];
const ran  = [];

for (const [name, mod, opts] of [
  ['jobkorea',   jobkorea,   { pages: 3, max: 130 }],
  ['greenhouse', greenhouse, {}],
  ['jobplanet',  jobplanet,  { pages: 1 }],
  ['wanted',     wanted,     {}],
  ['saramin',    saramin,    {}],
  ['worknet',    worknet,    {}],
  ['paste',      paste,      {}],
  ['linkedin',   linkedin,   {}],
  ['blind',      blind,      {}],
]) {
  if (!run(name)) continue;
  try {
    const got = await mod.pull(opts);
    jobs.push(...got);
    ran.push({ name, count: got.length });
  } catch (e) { console.log(`  ! ${name} 예외: ${e.message}`); ran.push({ name, count: 0, error: e.message }); }
}

// 중복 제거: 같은 회사 + 같은 제목
const seen = new Set();
const dedup = jobs.filter(j => {
  const k = `${j.co}|${j.title}`.toLowerCase();
  if (seen.has(k)) return false;
  seen.add(k); return true;
});

const report = {
  generatedAt: new Date().toISOString(),
  elapsedSec: +((Date.now() - t0) / 1000).toFixed(1),
  totals: { fetched: jobs.length, afterDedup: dedup.length },
  http: { sent: stats.sent, robotsBlocked: stats.blocked, failed: stats.failed },
  bySource: ran,
  robotsBlockSamples: stats.blockLog.slice(0, 10),
  refused: [linkedin.BLOCKED, blind.BLOCKED],
  derived: {
    englishReq: Object.entries(dedup.reduce((a, j) => (a[j.en] = (a[j.en] || 0) + 1, a), {})),
    degreeReq:  Object.entries(dedup.reduce((a, j) => (a[j.deg] = (a[j.deg] || 0) + 1, a), {})),
    newGradOk:  dedup.filter(j => j.yrs[0] === 0).length,
  },
};

fs.mkdirSync('fitline-data', { recursive: true });
fs.writeFileSync('fitline-data/jobs.json', JSON.stringify(dedup, null, 1));
fs.writeFileSync('fitline-data/ingest-report.json', JSON.stringify(report, null, 2));

console.log('\n══════ 수집 결과 ══════');
console.log(`공고 ${dedup.length}건 (중복 제거 전 ${jobs.length}) · ${report.elapsedSec}초`);
console.log(`HTTP 요청 ${stats.sent} · robots 차단 ${stats.blocked} · 실패 ${stats.failed}`);
console.log('영어 요건 분포:', report.derived.englishReq.map(([k, v]) => `${k}단계 ${v}건`).join(' / '));
console.log('학위 요건 분포:', report.derived.degreeReq.map(([k, v]) => `${k} ${v}건`).join(' / '));
console.log(`신입 지원 가능: ${report.derived.newGradOk}건`);
console.log('→ fitline-data/jobs.json, fitline-data/ingest-report.json');
