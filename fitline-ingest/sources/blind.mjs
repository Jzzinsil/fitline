// Blind — 실행 거부.
//   robots.txt:  User-agent: ClaudeBot → Disallow: /   (GPTBot, CCBot 등도 동일)
// 또한 채용공고 보드가 아니라 재직자 커뮤니티이고, 핵심 콘텐츠는 로그인 뒤에 있다.
// 기업 평판/연봉은 "사람이 읽고 판단"하는 참고자료로 두고 시스템에 넣지 않는다.
export const BLOCKED = {
  site: 'Blind',
  reason: 'robots.txt에서 ClaudeBot 전면 Disallow + 로그인 월 안쪽 콘텐츠',
  legalAlternatives: ['기업 평판은 헤드헌터가 직접 읽고 후보에게 구두로 전달', '잡플래닛 B2B 데이터 제휴로 정량 지표 확보'],
};
export async function pull() {
  console.log('✖ Blind — 실행 거부:', BLOCKED.reason);
  return [];
}
