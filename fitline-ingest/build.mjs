// 수집한 실데이터를 fitline.html 안에 주입한다. (아티팩트는 외부 fetch가 막혀 있어 임베드가 맞다)
import fs from 'node:fs';
import { withAnalytics } from './analytics.mjs';

const jobs = JSON.parse(fs.readFileSync('fitline-data/jobs.json', 'utf8'));
// 화면에서 안 쓰는 무거운 필드 제거 — 파일 크기와 로딩을 줄인다
const slim = jobs.map(({ evidence, ...j }) => ({
  ...j,
  evidence: {
    en: { from: evidence.en.from, quote: evidence.en.quote },
    deg: evidence.deg, yrs: evidence.yrs,
  },
}));

const html = fs.readFileSync('fitline.html', 'utf8');   // 소스 템플릿 (데이터 슬롯 비어 있음)
// </script> 로 파싱이 깨지지 않게 < 를 이스케이프
const payload = JSON.stringify(slim).replace(/</g, '\\u003c');
const RX = /(<script type="application\/json" id="jobs-data">)[\s\S]*?(<\/script>)/;
if (!RX.test(html)) { console.error('✖ 주입 슬롯을 못 찾았습니다.'); process.exit(1); }
const out = html.replace(RX, (_, a, b) => a + payload + b);
if (out === html) console.log('· 데이터 동일 — 변경 없음');
fs.mkdirSync('dist', { recursive: true });
const page = withAnalytics(out);
fs.writeFileSync('dist/fitline.html', page);
fs.writeFileSync('dist/index.html', page);   // Vercel 루트

const ai = slim.filter(j => j.aiRole).length;
console.log(`✔ dist/fitline.html에 ${slim.length}건 주입 (AI·데이터 직무 ${ai}건) · ${(out.length / 1024 / 1024).toFixed(2)}MB`);
