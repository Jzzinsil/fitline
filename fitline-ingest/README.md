# Fitline 공고 수집 파이프라인

## 실행

```bash
node fitline-ingest/run.mjs           # 전체
node fitline-ingest/run.mjs jobkorea  # 특정 소스만
node fitline-ingest/build.mjs         # 수집 결과를 fitline.html에 주입
```

## 원칙

1. **robots.txt가 게이트다.** 모든 요청은 `robots.mjs`의 `allowed()`를 통과해야 나간다.
   차단된 요청은 조용히 실패하지 않고 `ingest-report.json`의 `robotsBlockSamples`에 남는다.
2. **도메인당 1.2초 간격.** `fetch.mjs`가 강제한다.
3. **우회하지 않는다.** UA 위장, 프록시 로테이션, 로그인 세션 재사용, 엣지 차단 회피는 구현하지 않았다.
4. **추론에는 근거를 붙인다.** 영어·학위·경력은 공고 원문에서 뽑은 인용과 함께 저장된다 (`evidence`).
   근거 없는 숫자는 매칭에서 믿을 수 없다.

## 소스별 상태 (2026-08-21 실측)

| 소스 | 상태 | 근거 |
|---|---|---|
| 잡코리아 | **수집 중** (130건) | robots.txt가 AI 크롤러에 `Allow: /recruit/joblist`, `/Recruit/GI_Read`, `/recruit/ai-jobs` 명시 허용. 상세 페이지에 schema.org JobPosting 구조화 데이터가 있어 파싱 품질이 가장 좋다 |
| Greenhouse 공개 API | **수집 중** (440건) | `boards-api.greenhouse.io` 공식 공개 엔드포인트. 쿠팡·크래프톤·몰로코·샌드버드 |
| 잡플래닛 | 403 반송 | robots.txt는 공고 경로를 막지 않지만 실제 요청이 HTTP 403. B2B 제휴가 정식 경로 |
| 원티드 | 미수집 | robots.txt 자체가 CloudFront 403 → 허가 미확립. `WANTED_API_KEY` 넣으면 공식 API로 동작 |
| 사람인 | 키 대기 | `SARAMIN_API_KEY` |
| 워크넷(고용24) | 키 대기 | `WORKNET_API_KEY` — data.go.kr, 제약이 가장 적음 |
| LinkedIn | **실행 거부** | robots.txt: "자동 수단을 통한 접근은 명시적 허가 없이 엄격히 금지" + `ClaudeBot → Disallow: /` |
| Blind | **실행 거부** | `ClaudeBot → Disallow: /`. 로그인 월 안쪽 커뮤니티 |

## LinkedIn·Blind·원티드 공고를 넣는 방법

`fitline-data/pasted/*.txt`에 공고를 붙여넣으면 `paste.mjs`가 같은 정규화기를 태운다.
사람이 정상 열람한 내용의 수동 이관이라 약관 문제가 없다.

```
회사: Acme
포지션: ML Engineer
경력: 3~7년
근무지: 서울
(이하 공고 본문 붙여넣기)
```

## 사업으로 할 때 먼저 해야 할 것

- **직업안정법상 유료직업소개사업 등록** (관할 시·군·구). 등록 전에는 수수료를 받을 수 없다.
- **개인정보보호법** — 후보자 프로필은 전부 동의 기반. 채용 기업에 넘기는 것은 별도 동의 대상.
