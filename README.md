# Fitline

후보자의 **연구 주제·경력·영어 요건**을 채용공고에 대고 채점해서, 보낼 이유가 있는 한 건만 남기는 헤드헌팅 매칭 콘솔.

"AI 엔지니어"가 아니라 "대화 요약 박사 → Foundation Model 팀"으로 붙습니다. 전공명보다 논문 주제가 훨씬 강한 신호이고, 각 매칭의 상위 기여 항목이 그대로 아웃리치 첫 문단이 됩니다.

```bash
npm run ingest     # robots.txt가 허용한 소스에서 공고 수집
npm run build      # dist/ 로 빌드 (수집 데이터 주입)
open dist/fitline.html
```

데이터를 수집하지 않고 UI만 보려면 `fitline.html`을 그대로 열면 됩니다 (시드 공고 15건으로 동작).

---

## 판단을 네 층으로 나눈 이유

실데이터를 넣자마자 엔진이 거짓말을 했습니다. NLP 박사 신입의 1순위가 **"SW영업/기술지원" 88점**이었습니다. 원인은 셋이었고, 각각을 층으로 분리해 고쳤습니다.

| 층 | 하는 일 | 안 하면 |
|---|---|---|
| **1. 하드 게이트** | 학위·영어·경력·딜브레이커 미달을 점수와 무관하게 탈락 | 영어 못하는 후보가 본사 영어 필수 자리에 추천된다 |
| **2. 관련성 게이트** | 연구 주제도 도메인도 안 겹치면 "근거가 범용 스킬뿐"으로 강등 | Python 하나 겹쳤다고 모든 후보에게 Security Engineer가 상위로 뜬다 |
| **3. 커버리지 보정** | `×(0.5 + 0.5×커버리지)` — 3개 채운 매칭과 7개 채운 매칭을 같은 자에 올림 | 정보 없는 공고가 88점으로 1등을 한다 |
| **4. 가중치** | 남은 항목의 상대적 중요도, 고객사마다 조정 | — |

데이터가 없는 항목은 **0점이 아니라 `—`** 로 표시되고 가중치에서 빠집니다. 0점을 주면 *없는 사실*을 *나쁜 사실*로 바꾸는 것이라서요.

### 7개 채점 항목

역량 4개 — 연구·전공 적합 / 기술 스택 / 도메인 경험 / 경력 레벨
정합 3개 — 영어 요건 / 기업 성향 / 보상

## 수집 원칙

1. **robots.txt가 게이트다.** 모든 요청은 `robots.mjs`의 `allowed()`를 통과해야 나간다. 차단된 요청은 조용히 사라지지 않고 `ingest-report.json`에 남는다.
2. **도메인당 1.2초 간격.**
3. **우회하지 않는다.** UA 위장, 프록시 로테이션, 로그인 세션 재사용, 엣지 차단 회피는 구현하지 않았다.
4. **추론에는 근거를 붙인다.** 영어·학위·경력은 공고 원문 인용과 함께 저장된다. `영어 3 ← 라틴 문자 비율 39%`, `학위 박사 ← "박사후 연구원이 LLM 연구에 깊이 집중"`

### 소스별 상태 (2026-08-21 실측)

| 소스 | 상태 | 근거 |
|---|---|---|
| 잡코리아 | **동작** | robots.txt가 AI 크롤러에 `Allow: /recruit/joblist`, `/Recruit/GI_Read`, `/recruit/ai-jobs` 명시 허용. 상세 페이지에 schema.org JobPosting 구조화 데이터가 있어 파싱 품질이 가장 좋다 |
| Greenhouse 공개 API | **동작** | `boards-api.greenhouse.io` 공식 공개 엔드포인트 |
| 잡플래닛 | 403 | robots는 공고 경로를 막지 않으나 실제 요청이 HTTP 403. B2B 제휴가 정식 경로 |
| 원티드 | 미수집 | robots.txt 자체가 CloudFront 403 → 허가 미확립. 엣지 차단 우회는 하지 않음. `WANTED_API_KEY`로 공식 API 사용 |
| 사람인 | 키 대기 | `SARAMIN_API_KEY` |
| 워크넷(고용24) | 키 대기 | `WORKNET_API_KEY` — data.go.kr, 제약이 가장 적음 |
| LinkedIn | **실행 거부** | robots.txt: *"자동 수단을 통한 접근은 명시적 허가 없이 엄격히 금지"* + `ClaudeBot → Disallow: /` |
| Blind | **실행 거부** | `ClaudeBot → Disallow: /`. 로그인 월 안쪽 커뮤니티 |

**수집한 공고 데이터는 이 저장소에 포함되지 않습니다** (`.gitignore`). robots.txt가 준 건 접근 권한이지 재배포 권리가 아닙니다. 직접 `npm run ingest`를 돌리세요.

예외는 `fitline-data/greenhouse.json` 하나입니다. Greenhouse Job Board API는 기업이 **스스로 공개 배포하는 채널**이라 재배포가 그 취지에 부합하고, 이 스냅샷이 있어야 Vercel 빌드가 재현됩니다. 잡코리아 등 접근만 허용된 소스는 제외했습니다.

## 배포

```bash
npm run build:public   # Greenhouse 분만 dist/ 로 (공개 배포용)
npm run build          # 수집한 전체를 dist/ 로 (로컬 사용)
npm run build:demo     # 데이터 없이 시드 15건만
```

`vercel.json`이 `build:public`을 빌드 커맨드로 쓰기 때문에, Vercel에 올라가는 사이트에는 Greenhouse 440건만 들어갑니다. `X-Robots-Tag: noindex`도 걸어 뒀습니다.

### LinkedIn·Blind·원티드 공고를 넣는 방법

`fitline-data/pasted/*.txt`에 붙여넣으면 `paste.mjs`가 같은 정규화기를 태웁니다. 사람이 정상 열람한 내용의 수동 이관이라 약관 문제가 없습니다.

```
회사: Acme
포지션: ML Engineer
경력: 3~7년
근무지: 서울
(이하 공고 본문)
```

## 사업으로 할 때 먼저 해야 할 것

- **직업안정법상 유료직업소개사업 등록** (관할 시·군·구). 등록 전에는 수수료를 받을 수 없습니다.
- **개인정보보호법** — 후보자 프로필은 전부 동의 기반. 채용 기업에 넘기는 것은 별도 동의 대상입니다.

## 구조

```
fitline.html              단일 파일 콘솔 (스코어링 엔진 + UI). 데이터 슬롯 비어 있음
fitline-ingest/
  robots.mjs              robots.txt 파서 + 요청 게이트
  fetch.mjs               rate limit, 재시도, 차단 로그
  normalize.mjs           원본 → 스코어링 스키마. 영어/학위/경력 추론 + 근거
  sources/*.mjs           소스별 어댑터 (차단된 소스는 거부 스텁)
  run.mjs / build.mjs
fitline-data/             수집 결과 (gitignore)
dist/                     데이터 주입된 빌드 (gitignore)
```

후보자 12명은 **가명 데모 프로필**이며, 기업 평점·희망연봉은 임의값입니다.
