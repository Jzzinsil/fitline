// 공개 배포용 빌드. Greenhouse 공개 Job Board API에서 온 공고만 넣는다.
// 기업이 스스로 공개 API로 배포하는 채널이라 재배포가 그 취지에 부합한다.
// 잡코리아 등 robots.txt로 '접근'만 허용된 소스는 제외한다 — 접근 허가 ≠ 재배포 권리.
import fs from 'node:fs';

// 저장소에 커밋된 Greenhouse 스냅샷을 먼저 쓴다 (Vercel 빌드에서 재현 가능하게).
// 로컬에서 방금 수집했으면 jobs.json에서 Greenhouse 분만 추출한다.
let slim, srcLabel;
if (fs.existsSync('fitline-data/jobs.json')) {
  const all = JSON.parse(fs.readFileSync('fitline-data/jobs.json', 'utf8'));
  slim = all.filter(j => j.id.startsWith('gh-')).map(({ evidence, ...j }) => ({
    ...j,
    evidence: { en: { from: evidence.en.from, quote: evidence.en.quote }, deg: evidence.deg, yrs: evidence.yrs },
  }));
  srcLabel = `방금 수집한 jobs.json (전체 ${all.length}건 중 Greenhouse만)`;
} else {
  slim = JSON.parse(fs.readFileSync('fitline-data/greenhouse.json', 'utf8'));
  srcLabel = '저장소의 greenhouse.json 스냅샷';
}

const html = fs.readFileSync('fitline.html', 'utf8');
const RX = /(<script type="application\/json" id="jobs-data">)[\s\S]*?(<\/script>)/;
if (!RX.test(html)) { console.error('✖ 주입 슬롯을 못 찾았습니다.'); process.exit(1); }
const out = html.replace(RX, (_, a, b) => a + JSON.stringify(slim).replace(/</g, '\\u003c') + b);

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', out);
fs.writeFileSync('dist/fitline.html', out);

const by = {};
slim.forEach(j => { by[j.co] = (by[j.co] || 0) + 1 });
console.log(`✔ 공개 배포용 ${slim.length}건 — ${srcLabel}`);
console.log('  ' + Object.entries(by).map(([k, v]) => `${k} ${v}`).join(' · '));
console.log(`  AI·데이터 직무 ${slim.filter(j => j.aiRole).length}건 · ${(out.length / 1024).toFixed(0)}KB`);
