// Vercel Web Analytics — 정적 HTML용.
// 대시보드 안내는 React(@vercel/analytics + <Analytics/>) 기준이라 여기엔 안 맞는다.
// 정적 사이트는 Vercel이 배포에 자동으로 붙여주는 /_vercel/insights/script.js 한 줄이면 된다.
//
// 소스 fitline.html이 아니라 빌드 산출물에만 넣는다. 소스에 박으면 Vercel 밖
// (로컬 파일, Claude Artifact)에서 404 콘솔 에러가 난다.
// Vercel 공식 스니펫: 큐 스텁 + 로더.
// 스텁은 script.js 로드 전에 발생한 커스텀 이벤트를 버퍼링한다.
// 페이지뷰만 볼 거면 로더만으로도 되지만, 공식 형태를 그대로 따른다.
const TAG = [
  '<script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };<\/script>',
  '<script defer src="/_vercel/insights/script.js"><\/script>',
].join('\n');

export function withAnalytics(html) {
  if (html.includes('/_vercel/insights/script.js')) return html;
  // </script>로 끝나는 파일이라 맨 뒤에 붙인다
  return html.trimEnd() + '\n' + TAG + '\n';
}
