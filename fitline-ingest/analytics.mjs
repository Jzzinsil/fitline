// Vercel Web Analytics — 정적 HTML용.
// 대시보드 안내는 React(@vercel/analytics + <Analytics/>) 기준이라 여기엔 안 맞는다.
// 정적 사이트는 Vercel이 배포에 자동으로 붙여주는 /_vercel/insights/script.js 한 줄이면 된다.
//
// 소스 fitline.html이 아니라 빌드 산출물에만 넣는다. 소스에 박으면 Vercel 밖
// (로컬 파일, Claude Artifact)에서 404 콘솔 에러가 난다.
const TAG = '<script defer src="/_vercel/insights/script.js"></script>';

export function withAnalytics(html) {
  if (html.includes('/_vercel/insights/script.js')) return html;
  // </script>로 끝나는 파일이라 맨 뒤에 붙인다
  return html.trimEnd() + '\n' + TAG + '\n';
}
