// LinkedIn — 실행 거부. 사이트가 직접 금지한다.
//
// robots.txt 첫 줄:
//   "The use of robots or other automated means to access LinkedIn without the
//    express permission of LinkedIn is strictly prohibited."
// 그리고 우리 UA에 대한 명시 규칙:
//   User-agent: ClaudeBot → Disallow: /      (anthropic-ai, ChatGPT-User 등도 동일)
//
// 우회(다른 UA·프록시·로그인 세션 재사용)는 접근 통제 회피이므로 만들지 않는다.
// 합법 대체 경로는 아래 두 개.
export const BLOCKED = {
  site: 'LinkedIn',
  reason: 'robots.txt에서 ClaudeBot 전면 Disallow + 약관상 자동 접근 명시 금지',
  legalAlternatives: [
    'LinkedIn Talent Solutions / Recruiter 유료 계약 — 공식 API로 후보자·공고 접근',
    '후보자 본인이 프로필/이력서를 직접 제출 (동의 기반, paste.mjs로 파싱)',
  ],
};
export async function pull() {
  console.log('✖ LinkedIn — 실행 거부:', BLOCKED.reason);
  return [];
}
