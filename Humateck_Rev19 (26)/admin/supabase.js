/*
============================================================
⚠️ 절대 금지 지침 / 다음 담당자 필독
------------------------------------------------------------
이 시스템은 배송 시스템이다. 번역기, 검수기, 품질판단기, 거부기가 아니다.
사용자 명시 승인 없이는 아래 항목을 절대 추가, 복구, 변경하지 말 것.

[절대 금지]
1) 검수 로직 추가 금지
2) 자체 판단 로직 추가 금지
3) 자체 거부 / 반려 / 차단 / 보류 / 감점 / 제외 로직 추가 금지
4) 형식검사 실패 문구, 번역문 점검 문구, 자체 오류판정 문구 추가 금지
5) 불필요한 오류 표시 로직 추가 금지
6) defaultLanguage 비교 후 1개 빼기 같은 임의 제외 로직 금지
7) 직등록, 외부 번역문 즉시등록, 별도 검수탭 복구 금지
8) 유튜브/구글 응답 순화, 해석, 대체 문구 출력 금지
9) 협의되지 않은 문구, 구조, 위치, 버튼명, 흐름 변경 금지
10) 속도를 죽이는 순차전송, 과도한 검증, 파싱 강화 금지
11) Country Code 개수 기준 표시 원칙 임의 변경 금지
12) "사용자를 위해 고쳤다"는 이유로 구조를 뜯어고치는 행위 금지

[허용 범위]
- 배송에 꼭 필요한 최소 연결
- 크롬 팝업 승인 연결
- 유튜브/구글이 실제로 돌려준 원문 오류 표시
- 사용자가 명시 승인한 수정만 반영

한 줄 원칙:
우리는 배송만 한다. 검수하지 않는다. 자체 판단하지 않는다. 거부하지 않는다. 불필요한 오류를 만들지 않는다.
============================================================
*/

const COUNTRY_GUIDE_LIST = [
  ["ko","South Korea"],["en-US","United States"],["en-GB","United Kingdom"],
  ["es","Spain"],["fr","France"],["de","Germany"],["pt","Portugal"],
  ["it","Italy"],["ja","Japan"],["zh-CN","China (Simplified)"],
  ["zh-TW","China (Traditional)"],["ar","Saudi Arabia"],["hi","India"],
  ["ru","Russia"],["nl","Netherlands"],["pl","Poland"],["tr","Turkey"],
  ["sv","Sweden"],["da","Denmark"],["fi","Finland"],["cs","Czech Republic"],
  ["ro","Romania"],["hu","Hungary"],["el","Greece"],["th","Thailand"],
  ["id","Indonesia"],["ms","Malaysia"],["vi","Vietnam"],["uk","Ukraine"],
  ["fa","Iran"],["af","South Africa"],["sq","Albania"],["am","Ethiopia"],
  ["hy","Armenia"],["az","Azerbaijan"],["be","Belarus"],["bn","Bangladesh"],
  ["bs","Bosnia and Herzegovina"],["bg","Bulgaria"],["hr","Croatia"],
  ["et","Estonia"],["ka","Georgia"],["ht","Haiti"],["is","Iceland"],
  ["ga","Ireland"],["kn","India (Kannada)"],["kk","Kazakhstan"],
  ["km","Cambodia"],["rw","Rwanda"],["lv","Latvia"],["lt","Lithuania"],
  ["mk","North Macedonia"],["ml","India (Malayalam)"],["mt","Malta"],
  ["mr","India (Marathi)"],["mn","Mongolia"],["my","Myanmar"],
  ["ne","Nepal"],["pa","India (Punjabi)"],["sr","Serbia"],["sk","Slovakia"],
  ["sw","Kenya"],["tl","Philippines"],["ta","India (Tamil)"],
  ["te","India (Telugu)"],["yo","Nigeria"],["zu","South Africa (Zulu)"],
  ["ca","Catalonia"],["gl","Galicia"],["eu","Basque Country"]
];

const COUNTRY_GUIDE_LIST_30 = COUNTRY_GUIDE_LIST.slice(0, 30);
const COUNTRY_GUIDE_LIST_50 = COUNTRY_GUIDE_LIST.slice(0, 50);

// ── 닥달문 7개 (HTML dadal1~7 과 1:1 대응) ──────────────────
const DADAL = [
  '타언어 혼입, 문맥의 부자연스러움, 기타 문제를 자동으로 꼼꼼이 검수해 줘.',
  'Number: 와 Country Name: 줄만 삭제해 줘.\n중요: 나머지 형식은 지금처럼 그대로 유지할 것(Country Code:, Title:, Description:)',
  '타언어 혼입, 문맥의 부자연스러움, 기타 문제를 한 번 더 검수해 줘.\n형식은 그대로 유지해 줘.',
  '국가명이 삭제되었는지 다시 검수하고, 타언어 혼입, 문맥의 부자연스러움, 기타 문제를 다시 한 번 꼼꼼이 검수해 줘.',
  'number를 붙여 전체 번역 코드수를 집계해 봐.',
  '전체 숫자가 맞으면 number를 모두 지우고, 타언어 혼입, 문맥의 부자연스러움, 기타 문제를 마지막으로 꼼꼼이 검수해 줘.',
  '아래로 이동해 줘.'
];

const PROMPT_TEMPLATE = `제미나이 의뢰문

안녕 제미나이!
아래 제목과 설명문을 {activeCount}개 국가 세트에 맞춰 자연스럽게 현지화 번역해 줘.
처음부터 끝까지 중간에 끊지 말고 계속 번역해 줘.

[원문]
Title: {title}

Description:
{desc}

[출력 형식]
Number: 순번
Country Code: 언어코드
Country Name: 영어 국가명
Title: 번역된 제목
Description:
번역된 설명문

[핵심 원칙]
1. 처음부터 끝까지 절대 끊지 말고 계속 번역해 줘.
2. 작업내용 설명, 머리말, 맺음말, 해설문은 넣지 말아 줘.
3. 아래 대응표의 Country Code와 Country Name을 그대로 사용할 것
4. 블록 순서는 절대 바꾸지 말 것
5. 각 블록은 반드시 Country Code로 시작할 것
6. Description의 문단 구조와 줄바꿈은 원문 흐름을 유지할 것
7. 제목, 설명문 외의 군소리, 키워드 줄, 해시태그, 코드블록, HTML은 넣지 말 것
8. 작업이 끝났으면 아래로 이동해 줘.

[Country Code / Country Name 대응표]
{countryGuide}

[반드시 사용할 언어코드 및 순서]
{codeList}
`;

const TABS = [
  {tab:'tab-translate', content:'content-translate'},
  {tab:'tab-register',  content:'content-register'},
  {tab:'tab-members',   content:'content-members'},
  {tab:'tab-payment',   content:'content-payment'},
  {tab:'tab-trial',     content:'content-trial'},
];

// ── 상태 변수 ────────────────────────────────────────────────
let selectedPlan      = 50;
let ACTIVE_LIST       = COUNTRY_GUIDE_LIST_50;
let ACTIVE_COUNT      = 50;
let currentVideoId    = null;   // 번역 탭 Video ID
let directVideoId     = null;   // 직등록 탭 Video ID
let directSelectedPlan = 50;    // 직등록 탭 플랜
let accessToken       = null;   // ⚠️ 메모리에만 보관, 저장 절대 금지
let channelName       = '';

// ── 초기화 ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updatePlanUI();
  updatePlanDirectUI();
  initTabs();
  initButtons();
  listenOAuthToken();
});

// ── OAuth 토큰 수신 ──────────────────────────────────────────
function listenOAuthToken() {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'HUMATECK_OAUTH_TOKEN' && message.token) {
      accessToken = message.token;
      channelName = message.channelName || '';
      const label = channelName
        ? `🔐 OAuth 완료 (${channelName})`
        : '🔐 OAuth 인증 완료';
      document.getElementById('btnOAuthPopup').textContent = label;
      document.getElementById('btnOAuthPopup').style.background = '#27ae60';
      showStatus('✅ Google OAuth 인증 완료! YouTube 등록 준비됩니다.', 'ok');
    }
  });
}

// ── 번역 탭 플랜 ─────────────────────────────────────────────
function setPlan(n) {
  selectedPlan = n;
  if (n === 30)      { ACTIVE_LIST = COUNTRY_GUIDE_LIST_30; ACTIVE_COUNT = 30; }
  else if (n === 50) { ACTIVE_LIST = COUNTRY_GUIDE_LIST_50; ACTIVE_COUNT = 50; }
  else               { ACTIVE_LIST = COUNTRY_GUIDE_LIST;    ACTIVE_COUNT = 70; }
  updatePlanUI();
}

function updatePlanUI() {
  const p30 = document.getElementById('plan30');
  const p50 = document.getElementById('plan50');
  const p70 = document.getElementById('plan70');
  const lc  = document.getElementById('langCount');
  if (!p30||!p50||!p70) return;
  p30.classList.toggle('active', selectedPlan===30);
  p50.classList.toggle('active', selectedPlan===50);
  p70.classList.toggle('active', selectedPlan===70);
  if (lc) lc.textContent = selectedPlan + ' langs';
}

// ── 직등록 탭 플랜 ───────────────────────────────────────────
function setPlanDirect(n) {
  directSelectedPlan = n;
  ['30','50','70'].forEach(p => {
    const btn = document.getElementById('dplan'+p);
    if (btn) btn.classList.toggle('active', parseInt(p) === n);
  });
}

function updatePlanDirectUI() {
  setPlanDirect(directSelectedPlan);
}

// ── 탭 전환 ─────────────────────────────────────────────────
function switchTab(tabId, contentId) {
  TABS.forEach(t => {
    const te = document.getElementById(t.tab);
    const ce = document.getElementById(t.content);
    if (te) te.classList.remove('active');
    if (ce) ce.classList.remove('active');
  });
  const te = document.getElementById(tabId);
  const ce = document.getElementById(contentId);
  if (te) te.classList.add('active');
  if (ce) ce.classList.add('active');
}

function initTabs() {
  TABS.forEach(({tab, content}) => {
    $on(tab, 'click', () => switchTab(tab, content));
  });
}

// ── 안전 이벤트 리스너 헬퍼 (요소 없어도 오류 없음) ─────────
function $on(id, event, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, fn);
}

// ── 버튼 초기화 ──────────────────────────────────────────────
function initButtons() {
  // 번역 탭 — 플랜
  $on('plan30', 'click', () => setPlan(30));
  $on('plan50', 'click', () => setPlan(50));
  $on('plan70', 'click', () => setPlan(70));

  // 번역 탭 — URL 자동 추출
  $on('inputUrl', 'input', extractVideoIdTranslate);

  // 번역 탭 — 의뢰문/복사/Gemini/등록
  $on('btnGenerate',    'click', generateRequest);
  $on('btnCopy',        'click', copyRequest);
  $on('btnGemini',      'click', openGemini);
  $on('btnGotoRegister','click', translateRegister);

  // 번역 탭 — 닥달문 7개
  for (let i = 1; i <= 7; i++) {
    $on('dadal'+i, 'click', () => copyDadal(i));
  }

  // 직등록 탭 — 플랜
  $on('dplan30', 'click', () => setPlanDirect(30));
  $on('dplan50', 'click', () => setPlanDirect(50));
  $on('dplan70', 'click', () => setPlanDirect(70));

  // 직등록 탭 — URL 자동 추출
  $on('directUrl', 'input', extractVideoIdDirect);

  // 직등록 탭 — 등록 버튼
  $on('btnDirectRegister',  'click', directRegister);

  // 직등록 탭 — 중요설정 길잡이 (바로 펼쳐서 열기)
  $on('btnDirectOauthGuide','click', () => {
    chrome.windows.create({
      url: chrome.runtime.getURL('oauth_popup.html?guide=open'),
      type: 'popup',
      width: 500,
      height: 680
    });
  });

  // 회원/결제
  $on('btnLoadMembers', 'click', loadMembers);
  $on('btnLoadTrials',  'click', loadTrials);
  $on('linkSupabase',   'click', () =>
    chrome.tabs.create({url:'https://supabase.com/dashboard/project/agxxpcgxgggkcdqvwmvg'}));
  $on('linkPaddle',     'click', () =>
    chrome.tabs.create({url:'https://vendors.paddle.com'}));

  // OAuth 헤더 버튼
  $on('btnOAuthPopup',  'click', openOAuthPopup);
}

// ── OAuth 팝업 열기 ──────────────────────────────────────────
function openOAuthPopup() {
  chrome.windows.create({
    url: chrome.runtime.getURL('oauth_popup.html'),
    type: 'popup',
    width: 500,
    height: 680
  });
}

// ── 번역 탭 Video ID 자동 추출 ──────────────────────────────
function extractVideoIdTranslate() {
  const url = document.getElementById('inputUrl').value.trim();
  const videoId = parseVideoId(url);
  const el = document.getElementById('extractedId');
  if (videoId) {
    currentVideoId = videoId;
    if (el) el.textContent = '✅ Video ID: ' + videoId;
  } else {
    currentVideoId = null;
    if (el) el.textContent = url.length > 0 ? '❌ URL을 확인해 주세요.' : '';
  }
}

// ── 직등록 탭 Video ID 자동 추출 ────────────────────────────
function extractVideoIdDirect() {
  const url = document.getElementById('directUrl').value.trim();
  const videoId = parseVideoId(url);
  const el = document.getElementById('directExtractedId');
  if (videoId) {
    directVideoId = videoId;
    if (el) el.textContent = '✅ Video ID: ' + videoId;
  } else {
    directVideoId = null;
    if (el) el.textContent = url.length > 0 ? '❌ URL을 확인해 주세요.' : '';
  }
}

// ── YouTube URL → Video ID 파싱 ─────────────────────────────
function parseVideoId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace('/', '') || null;
    }
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const parts = u.pathname.split('/');
    const shortsIdx = parts.indexOf('shorts');
    if (shortsIdx >= 0 && parts[shortsIdx+1]) return parts[shortsIdx+1];
    const videoIdx = parts.indexOf('video');
    if (videoIdx >= 0 && parts[videoIdx+1]) return parts[videoIdx+1];
  } catch(e) {}
  return null;
}

// ── 번역 의뢰문 생성 ────────────────────────────────────────
function generateRequest() {
  const title = document.getElementById('inputTitle').value.trim();
  const desc  = document.getElementById('inputDesc').value.trim();
  if (!title) { showStatus('영상 제목을 입력해 주세요.', 'err'); return; }

  const countryGuide = ACTIVE_LIST.map(([code,name],i) => `${i+1}. ${code} | ${name}`).join('\n');
  const codeList     = ACTIVE_LIST.map(([code]) => `"${code}"`).join(', ');

  const request = PROMPT_TEMPLATE
    .replace('{title}',        title)
    .replace('{desc}',         desc || '(설명문 없음)')
    .replace('{countryGuide}', countryGuide)
    .replace('{activeCount}',  String(ACTIVE_COUNT))
    .replace('{codeList}',     codeList);

  document.getElementById('generatedRequest').value = request;
  flashBtn('btnGenerate');
  showStatus('✅ 의뢰문 생성 완료! 복사 후 Gemini에 붙여넣기 하세요.', 'ok');
}

// ── 클립보드 복사 ────────────────────────────────────────────
async function copyRequest() {
  const text = document.getElementById('generatedRequest').value;
  if (!text) { showStatus('먼저 의뢰문을 생성해 주세요.', 'err'); return; }
  try {
    await navigator.clipboard.writeText(text);
    setCopied('btnCopy', '✅ Copied!');
    showStatus('📋 클립보드에 복사되었습니다!', 'ok');
  } catch(e) { showStatus('복사 실패.', 'err'); }
}

// ── 닥달문 복사 (1~7) ────────────────────────────────────────
async function copyDadal(n) {
  try {
    await navigator.clipboard.writeText(DADAL[n-1]);
    setCopied('dadal'+n, '✅ '+n+'번 복사완료!');
    showStatus(`📋 ${n}번 복사완료! Gemini에 붙여넣기 하세요.`, 'ok');
  } catch(e) { showStatus('복사 실패.', 'err'); }
}

// ── 복사 완료 효과 ───────────────────────────────────────────
function setCopied(id, label) {
  const btn = document.getElementById(id);
  if (!btn) return;
  const original = btn.innerHTML;
  btn.classList.add('btn-copied','btn-flash');
  btn.innerHTML = label;
  setTimeout(() => {
    btn.classList.remove('btn-copied','btn-flash');
    btn.innerHTML = original;
  }, 2000);
}

function flashBtn(id) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.classList.add('btn-flash');
  setTimeout(() => btn.classList.remove('btn-flash'), 300);
}

// ── Gemini 열기 ──────────────────────────────────────────────
function openGemini() {
  chrome.tabs.create({ url: 'https://gemini.google.com/app' });
  setCopied('btnGemini', '✨ Gemini 열림!');
  showStatus('✨ Gemini가 열렸습니다!', 'info');
}

// ── 번역 탭: 확인 및 유튜브 등록하기 ────────────────────────
function translateRegister() {
  const result = document.getElementById('translationResultMain').value.trim();
  if (!result) { showStatus('번역 결과를 먼저 붙여넣기 해주세요.', 'err'); return; }
  if (!currentVideoId) { showStatus('YouTube URL을 먼저 입력해 주세요.', 'err'); return; }

  // 결과 섹션 표시
  document.getElementById('translateResultSection').style.display = 'block';
  document.getElementById('translateProgressFill').style.width = '0%';
  document.getElementById('translateProgressTxt').textContent = '등록 중...';
  document.getElementById('translateDeliveryLog').value = '';

  doRegister({
    videoId:        currentVideoId,
    text:           result,
    logId:          'translateDeliveryLog',
    progressFillId: 'translateProgressFill',
    progressTxtId:  'translateProgressTxt'
  });
}

// ── 직등록 탭: 바로 유튜브 등록하기 ─────────────────────────
function directRegister() {
  if (!directVideoId) { showStatus('YouTube URL을 입력해 주세요.', 'err'); return; }
  const text = document.getElementById('directTranslation').value.trim();
  if (!text) { showStatus('번역물을 붙여넣기 해주세요.', 'err'); return; }

  // 결과 섹션 표시
  document.getElementById('directResultSection').style.display = 'block';
  document.getElementById('directProgressFill').style.width = '0%';
  document.getElementById('directProgressTxt').textContent = '등록 중...';
  document.getElementById('directDeliveryLog').value = '';

  doRegister({
    videoId:        directVideoId,
    text:           text,
    logId:          'directDeliveryLog',
    progressFillId: 'directProgressFill',
    progressTxtId:  'directProgressTxt'
  });
}

// ── 공통 YouTube 등록 처리 ───────────────────────────────────
async function doRegister({ videoId, text, logId, progressFillId, progressTxtId }) {
  if (!accessToken) {
    showStatus('먼저 🔐 OAuth 버튼으로 Google 인증을 해주세요.', 'err');
    return;
  }

  const logBox = document.getElementById(logId);
  function logLine(msg) {
    if (!logBox) return;
    const now = new Date().toLocaleTimeString('ko-KR');
    logBox.value += `[${now}] ${msg}\n`;
    logBox.scrollTop = logBox.scrollHeight;
  }

  const items = parseFinalText(text);
  if (!items.length) { showStatus('번역 결과 형식을 확인해 주세요.', 'err'); return; }

  showStatus('🌍 YouTube에 등록 중...', 'info');

  try {
    const existing    = await fetchVideo(videoId);
    const defaultLang = (existing.snippet?.defaultLanguage || '').toLowerCase();

    // ⚠️ defaultLanguage 와 동일 언어 제외
    const newMap = {};
    items.forEach(item => {
      if (item.code && item.code.toLowerCase() !== defaultLang) {
        newMap[item.code] = {
          title:       item.title       || '',
          description: item.description || ''
        };
      }
    });

    if (!Object.keys(newMap).length) throw new Error('전송할 번역 언어가 없습니다.');

    const merged = Object.assign({}, existing.localizations || {}, newMap);
    logLine(`전송 언어 수: ${Object.keys(newMap).length}`);

    await updateVideoLocalizations(videoId, existing, merged);

    const done = Object.keys(newMap).length;
    document.getElementById(progressFillId).style.width = '100%';
    document.getElementById(progressTxtId).textContent  = `✅ ${done}개국 등록 완료!`;
    showStatus(`✅ ${done}개국 등록 완료!`, 'ok');
    logLine(`실등록 성공: ${done}개국`);

  } catch(e) {
    showStatus(`❌ 등록 실패: ${e.message}`, 'err');
    logLine(`실등록 실패: ${e.message}`);
  }
}

// ── YouTube API - 영상 정보 조회 ────────────────────────────
async function fetchVideo(videoId) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,localizations&id=${encodeURIComponent(videoId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'videos.list 실패');
  const item = data.items && data.items[0];
  if (!item) throw new Error('대상 영상을 찾지 못했습니다.');
  return item;
}

// ── YouTube API - 로컬라이제이션 업데이트 ───────────────────
async function updateVideoLocalizations(videoId, existingVideo, mergedLocalizations) {
  const snippet = existingVideo.snippet || {};
  if (!snippet.title)      throw new Error('기존 영상의 snippet.title을 찾지 못했습니다.');
  if (!snippet.categoryId) throw new Error('기존 영상의 snippet.categoryId를 찾지 못했습니다.');

  // ⚠️ defaultLanguage 절대 "en" 으로 설정하지 말 것
  const defaultLanguage = snippet.defaultLanguage || '';

  const body = {
    id: videoId,
    snippet: {
      title:           snippet.title,
      categoryId:      snippet.categoryId,
      defaultLanguage: defaultLanguage
    },
    localizations: mergedLocalizations
  };

  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/videos?part=snippet,localizations',
    {
      method: 'PUT',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'videos.update 실패');
  return data;
}

// ── 최종 번역 파싱 ───────────────────────────────────────────
function parseFinalText(text) {
  const lines = (text || '').replace(/\r/g, '').split('\n');
  const items = [];
  let cur  = null;
  let mode = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const cc = line.match(/^Country Code:\s*(.+)$/i);
    if (cc) {
      if (cur) items.push(cur);
      cur = { code: cc[1].trim(), title: '', description: '' };
      mode = null;
      continue;
    }
    if (!cur) continue;
    const ti = line.match(/^Title:\s*(.*)$/i);
    if (ti) { cur.title = ti[1].trim(); mode = null; continue; }
    if (/^Description:\s*$/i.test(line)) { mode = 'description'; continue; }
    if (/^Country Name:\s*/i.test(line) ||
        /^Number:\s*/i.test(line) ||
        /^Nmber:\s*/i.test(line)) continue;
    if (mode === 'description') {
      cur.description += (cur.description ? '\n' : '') + line;
    }
  }
  if (cur) items.push(cur);
  return items.filter(x => x.code && x.title);
}

// ── 상태 메시지 ──────────────────────────────────────────────
function showStatus(msg, type) {
  const el = document.getElementById('statusMsg');
  if (el) el.innerHTML = `<div class="status status-${type}">${msg}</div>`;
}

// ── Supabase 설정 ────────────────────────────────────────────
const SUPABASE_URL  = 'https://agxxpcgxgggkcdqvwmvg.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneHhwY2d4Z2dna2NkcXZ3bXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzA0MzAsImV4cCI6MjA5MTIwNjQzMH0.lmbWyY3sxfowqA_2L4PKp2_VOyxm4dBdZIW43aLxM-0';

// ── 회원 목록 ────────────────────────────────────────────────
async function loadMembers() {
  showStatus('회원 정보 불러오는 중...', 'info');
  try {
    const res  = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.desc`, {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` }
    });
    const data = await res.json();
    const total    = data.length;
    const active   = data.filter(u => u.plan_status==='active').length;
    const inactive = total - active;
    document.getElementById('statTotal').textContent    = total;
    document.getElementById('statActive').textContent   = active;
    document.getElementById('statInactive').textContent = inactive;
    document.getElementById('memberList').innerHTML = data.map(u => `
      <div class="member-card">
        <div class="member-email">${u.email||'-'}</div>
        <div class="member-info">
          ${u.name||'-'} &nbsp;|&nbsp;
          <span class="badge ${u.plan_status==='active'?'badge-active':'badge-inactive'}">
            ${u.plan_status==='active'?'활성':'미구독'}
          </span>
          &nbsp;|&nbsp; ${u.plan||'플랜없음'}
        </div>
      </div>
    `).join('');
    showStatus(`✅ 회원 ${total}명 로드 완료!`, 'ok');
  } catch(e) { showStatus('회원 로드 실패: '+e.message, 'err'); }
}

// ── 무료체험 현황 ────────────────────────────────────────────
async function loadTrials() {
  showStatus('체험 정보 불러오는 중...', 'info');
  try {
    const res  = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.desc`, {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` }
    });
    const data = await res.json();
    const now  = new Date();
    const trialData = data.filter(u => u.trial_end);
    const active    = trialData.filter(u => new Date(u.trial_end) > now).length;
    const expired   = trialData.filter(u => new Date(u.trial_end) <= now).length;
    const converted = data.filter(u => u.plan_status==='active').length;
    document.getElementById('statTrialActive').textContent    = active;
    document.getElementById('statTrialExpired').textContent   = expired;
    document.getElementById('statTrialConverted').textContent = converted;
    document.getElementById('trialList').innerHTML = trialData.map(u => {
      const end       = new Date(u.trial_end).toLocaleDateString();
      const isExpired = new Date(u.trial_end) <= now;
      return `
        <div class="member-card">
          <div class="member-email">${u.email||'-'}</div>
          <div class="member-info">
            만료일: ${end} &nbsp;
            <span class="badge ${isExpired?'badge-inactive':'badge-trial'}">
              ${isExpired?'만료':'체험중'}
            </span>
          </div>
        </div>`;
    }).join('');
    showStatus('✅ 체험 현황 로드 완료!', 'ok');
  } catch(e) { showStatus('로드 실패: '+e.message, 'err'); }
}
