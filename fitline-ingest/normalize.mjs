// 원본 공고 → Fitline 스코어링 스키마.
// 추론한 값에는 반드시 근거(evidence)를 남긴다. 근거 없는 숫자는 매칭에서 못 믿는다.

const SKILLS = {
  'Python':/\bpython\b|파이썬/i, 'PyTorch':/pytorch|파이토치/i, 'TensorFlow':/tensorflow/i, 'JAX':/\bjax\b/i,
  'LLM 파인튜닝':/fine-?tun|파인튜닝|sft\b|instruction tun/i, 'RLHF':/rlhf|dpo\b|사람 피드백/i,
  'vLLM':/vllm|tensorrt-?llm|sglang/i, '분산학습':/distributed train|deepspeed|fsdp|megatron|분산 ?학습/i,
  'CUDA':/\bcuda\b/i, 'Triton':/\btriton\b/i, '양자화':/quantiz|양자화|int8|int4|gptq|awq/i,
  'ONNX':/\bonnx\b/i, 'TensorRT':/tensorrt/i, 'Kubernetes':/kubernetes|k8s|쿠버네티스/i,
  'Kubeflow':/kubeflow/i, 'Airflow':/airflow/i, 'Spark':/\bspark\b/i, 'Kafka':/\bkafka\b/i,
  'Feature Store':/feature store|피처 ?스토어/i, 'SQL':/\bsql\b/i,
  '대용량 데이터':/large-?scale data|대용량 (데이터|트래픽)|petabyte|빅데이터/i,
  'ML 서빙':/model serving|ml serving|인퍼런스|inference serv|모델 서빙|배포 파이프라인/i,
  '추천 모델':/recommend|추천 ?(시스템|모델|엔진)|ctr\b|ranking model/i,
  '그래프 ML':/graph (neural|ml)|\bgnn\b|그래프 ?(신경망|기반)/i,
  'Segmentation':/segmentation|세그멘테이션|분할/i, 'Detection':/detection|객체 ?(검출|인식)|디텍션/i,
  'Diffusion':/diffusion|확산 ?모델|stable diffusion/i, 'ASR':/\basr\b|speech recognition|음성 ?인식|stt\b/i,
  'TTS':/\btts\b|speech synthesis|음성 ?합성/i, 'RAG':/\brag\b|retrieval-?augmented|검색 증강/i,
  'LangChain':/langchain|llama-?index/i, 'A/B 테스트':/a\/b test|ab test|실험 ?설계|온라인 실험/i,
  '인과추론':/causal infer|인과 ?추론|uplift/i, 'ROS':/\bros2?\b/i, 'Sim2Real':/sim-?to-?real|sim2real/i,
  'DICOM':/dicom|pacs\b|의료 ?영상/i, 'C++':/\bc\+\+\b/i,
};

const DOMAINS = {
  'LLM':/\bllm\b|large language model|생성 ?ai|generative ai|foundation model|초거대 ?(ai|모델)|gpt|파운데이션 모델/i,
  '대화':/대화 ?(모델|시스템|엔진)|dialogue (model|system)|chatbot|챗봇|conversational ai/i,
  'NLP':/\bnlp\b|자연어 ?(처리|이해)|natural language process/i,
  '비전':/computer vision|컴퓨터 ?비전|이미지 ?(인식|분류|생성)|영상 ?(인식|분석)|object detection|ocr\b/i,
  '음성':/음성 ?(인식|합성|처리)|speech (recognition|synthesis)|\basr\b|\btts\b/i,
  '추천':/추천 ?(시스템|모델|엔진|알고리즘|서비스)|recommend(er|ation) (system|model|engine)|personaliz(ation|ed)|ctr ?예측/i,
  '검색':/검색 ?(엔진|품질|랭킹|시스템)|search (ranking|relevance|quality|engine)|정보 ?검색|query understanding/i,
  '이상탐지':/이상 ?(거래|탐지|행위)|anomaly detection|fraud detection|어뷰징 ?(탐지|대응)|abuse detection/i,
  '금융':/핀테크|fintech|가상자산|블록체인|증권|여신|보험 ?(심사|계리)|금융 ?(데이터|모델|서비스|플랫폼)/i,
  '헬스케어':/의료 ?(영상|ai|데이터)|헬스케어|healthcare ai|임상 ?(시험|데이터|검증)|clinical (trial|validation)|신약|바이오 ?인포/i,
  '로보틱스':/로봇 ?(제어|학습|자율)|robot(ics| learning| control)|매니퓰레이[션터]|autonomous driving|자율주행/i,
  '강화학습':/강화 ?학습|reinforcement learning|\brlhf\b|policy gradient/i,
  '온디바이스':/on-?device|온디바이스|엣지 ?(ai|디바이스)|edge (ai|inference)|\bnpu\b|모델 ?(경량화|압축)|quantization/i,
  'MLOps':/mlops|ml ?(platform|pipeline|infra)|ml ?(플랫폼|파이프라인|인프라)|모델 ?(서빙|배포|운영)|feature store/i,
  '광고':/광고 ?(플랫폼|최적화|타게팅)|ad ?(tech|serving|ranking)|advertis(ing|ement) (platform|optimi)|dsp\b|rtb\b/i,
  '제조':/스마트 ?팩토리|제조 ?(공정|ai|데이터)|반도체 ?(공정|설계)|설비 ?(예지|이상|제어)|공정 ?(최적화|불량)|양산 ?라인/i,
  '커머스':/이커머스|e-?commerce|커머스 ?(플랫폼|데이터|서비스)|리테일 ?(테크|데이터)|상품 ?(추천|랭킹)/i,
  '게임':/게임 ?(ai|데이터|서버|클라이언트)|game (ai|server|client)|게임 ?(개발|기획)/i,
};

const ev = (value, from, quote) => ({ value, from, quote: quote ? String(quote).slice(0, 90) : null });

// ── 영어 요건 1~5 ───────────────────────────────────────────
export function inferEnglish(text, { foreign = false, englishPosting = false } = {}) {
  const t = text || '';
  const latin = (t.match(/[A-Za-z]/g) || []).length / Math.max(1, t.replace(/\s/g, '').length);
  if (/native|원어민|영어 ?(면접|필수)|english (is )?(required|mandatory)|fluent in english|business.?level english/i.test(t))
    return ev(5, '본문 명시', t.match(/[^.。\n]{0,60}(영어 ?(면접|필수)|native|원어민|fluent in english|english (is )?(required|mandatory)|business.?level english)[^.。\n]{0,40}/i)?.[0]
      || t.match(/.{0,40}(native|원어민|영어 ?(면접|필수)|business.?level english|fluent in english).{0,40}/i)?.[0]);
  if (latin > 0.62 && t.length > 400) return ev(4, '공고 본문이 영문', `라틴 문자 비율 ${(latin * 100).toFixed(0)}%`);
  if (latin > 0.35 && t.length > 400) return ev(3, '공고에 영문 비중 상당', `라틴 문자 비율 ${(latin * 100).toFixed(0)}%`);
  if (/영어 ?(능통|우수)|proficient in english|written and verbal english/i.test(t))
    return ev(4, '본문 명시', t.match(/[^.。\n]{0,40}(영어 ?(능통|우수)|proficient in english)[^.。\n]{0,25}/i)?.[0]);
  if (/영어 ?가능(자)?|영어 ?(회화|커뮤니케이션)|english communication|영문 ?(문서|이메일)/i.test(t))
    return ev(3, '우대조건/본문', t.match(/[^.。\n]{0,40}(영어 ?가능자?|english communication|영문 ?문서)[^.。\n]{0,25}/i)?.[0]);
  if (foreign) return ev(3, '외국계 기업 (본문에 영어 요건 명시 없음)', null);
  return ev(2, '영어 언급 없음 → 국내 기준 기본값', null);
}

// ── 학위 요건 ────────────────────────────────────────────────
export function inferDegree(eduText, body = '') {
  // 본문 전체에서 '박사'를 찾으면 무관한 문단에 걸린다. 학력/자격 맥락 창만 본다.
  const win = [];
  for (const m of (body || '').matchAll(/(학력|지원자격|자격요건|education|qualification|degree)/gi))
    win.push(body.slice(m.index, m.index + 240));
  const t = `${eduText || ''} ${win.join(' ')}`;
  if (/박사|ph\.?d|doctoral/i.test(t)) {
    const pref = /박사 ?(우대|선호)|phd preferred/i.test(t);
    return { value: pref ? '석사' : '박사', prefer: pref ? ['박사'] : [], from: pref ? '박사 우대' : '박사 요구', quote: t.match(/[^,\n]{0,30}(박사|ph\.?d)[^,\n]{0,20}/i)?.[0]?.trim() };
  }
  if (/석사|master'?s/i.test(t)) {
    const pref = /석사 ?(우대|선호)|master'?s preferred/i.test(t);
    return { value: pref ? '학사' : '석사', prefer: pref ? ['석사', '박사'] : ['박사'], from: pref ? '석사 우대' : '석사 요구', quote: t.match(/[^,\n]{0,30}(석사|master)[^,\n]{0,20}/i)?.[0]?.trim() };
  }
  if (/학력 ?무관|no degree|학력무관/i.test(t)) return { value: '학사', prefer: [], from: '학력 무관 → 게이트 없음', quote: '학력무관', any: true };
  return { value: '학사', prefer: ['석사'], from: /대졸|bachelor|학사/i.test(t) ? '대졸 이상' : '명시 없음 → 학사 기본값', quote: t.match(/[^,\n]{0,20}(대졸|학사|bachelor)[^,\n]{0,15}/i)?.[0]?.trim() };
}

// ── 경력 범위 ────────────────────────────────────────────────
export function inferYears(expText, body = '') {
  const t = `${expText || ''} ${body}`;
  let m;
  if ((m = t.match(/(\d{1,2})\s*[~\-–]\s*(\d{1,2})\s*년/))) return { value: [+m[1], +m[2]], from: '범위 명시', quote: m[0] };
  if ((m = t.match(/(\d{1,2})\+?\s*years?/i)))               return { value: [+m[1], +m[1] + 7], from: '하한 명시(영문)', quote: m[0] };
  if ((m = t.match(/경력\s*(\d{1,2})\s*년\s*이상/)))          return { value: [+m[1], +m[1] + 7], from: '하한 명시', quote: m[0] };
  if ((m = t.match(/(\d{1,2})\s*년\s*이상/)))                 return { value: [+m[1], +m[1] + 7], from: '하한 명시', quote: m[0] };
  if (/신입\s*[·,\/]\s*경력|경력\s*[·,\/]\s*신입/.test(t))    return { value: [0, 10], from: '신입·경력 동시', quote: t.match(/신입\s*[·,\/]\s*경력|경력\s*[·,\/]\s*신입/)[0] };
  if (/신입|entry.?level|new ?grad/i.test(t))                 return { value: [0, 2],  from: '신입', quote: t.match(/신입|entry.?level|new ?grad/i)[0] };
  if (/경력\s*무관|무관/.test(t))                             return { value: [0, 20], from: '경력 무관', quote: '경력무관' };
  return { value: [0, 20], from: '명시 없음 → 게이트 해제', quote: null };
}

// AI·데이터 직무인지. 배송기사/건설현장 공고를 매칭 대상에서 걸러내는 기준.
const AI_TITLE = /\b(ai|ml|mlops|llm|nlp|cv|데이터|data|machine learning|deep learning|research|scientist|analyt|알고리즘|algorithm|모델링|모델|인공지능|머신러닝|딥러닝|비전|vision|추천|search|ranking|백엔드|backend|서버|플랫폼|platform|engineer|엔지니어|개발자|developer|sw|소프트웨어|개발 ?직군?|개발직)\b/i;
const NOT_AI = /(배송|택배|기사|운전|물류 ?(센터|현장)|창고|상하차|건설 ?현장|시공|영업 ?(사원|관리)|판매|매장|고객 ?(상담|서비스)|콜센터|간호|조리|미화|경비|생산 ?직|현장 ?관리|주식 ?전문가|보험 ?설계|텔레마케|영업|기술 ?지원|it ?컨설턴트|부트캠프|교육생|수강생|훈련생|국비|\bKDT\b|아카데미 ?모집|강사|보조강사|강의|배움터|교육 ?(과정|생|기관)|튜터|멘토 ?모집|채용연계형? ?(교육|캠프))/;
function isAiRole(title, skills, domains) {
  if (NOT_AI.test(title)) return false;
  if (AI_TITLE.test(title)) return true;
  return skills.length >= 3 && domains.length >= 1;
}

function dict(text, table) {
  const out = [];
  for (const [k, rx] of Object.entries(table)) if (rx.test(text)) out.push(k);
  return out;
}

// ── 최종 정규화 ──────────────────────────────────────────────
export function normalize(raw) {
  const body = `${raw.title || ''}\n${raw.description || ''}\n${raw.extra || ''}`;
  const en = inferEnglish(body, { foreign: raw.foreign, englishPosting: raw.englishPosting });
  const deg = inferDegree(raw.education, body);
  const yrs = inferYears(raw.experience, body);
  const skills = dict(body, SKILLS);
  const domains = dict(body, DOMAINS);
  const must = skills.slice(0, Math.max(1, Math.ceil(skills.length * 0.5)));
  const aiRole = isAiRole(raw.title || '', skills, domains);
  return {
    id: `${raw.source}-${raw.sourceId}`,
    co: raw.company, title: (raw.title || '').replace(/\s+/g, ' ').trim().slice(0, 80),
    team: raw.team || raw.department || '—',
    type: raw.type || '미분류',
    yrs: yrs.value, en: en.value, deg: deg.value, degPref: deg.prefer,
    majors: [], research: domains.slice(0, 4),
    must: must.length ? must : ['Python'], nice: skills.slice(must.length),
    domains: domains.length ? domains : ['미분류'],
    comp: raw.comp || null,
    loc: raw.location || '—', src: raw.sourceLabel, url: raw.url,
    strength: [], flags: [], rate: { jp: null, bl: null },
    posted: raw.posted || null, closes: raw.closes || null, aiRole,
    // 추론 근거 — UI에서 "이 숫자 어디서 나왔나" 대답용
    evidence: {
      en: { ...en }, deg: { from: deg.from, quote: deg.quote }, yrs: { from: yrs.from, quote: yrs.quote },
      skills: `본문 키워드 ${skills.length}개 일치`, domains: `도메인 키워드 ${domains.length}개 일치`,
    },
  };
}
