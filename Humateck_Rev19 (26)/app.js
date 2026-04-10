// ── 상수 ──
const COUNTRY_GUIDE_LIST = [["ko","South Korea"],["en-US","United States"],["en-GB","United Kingdom"],["es","Spain"],["fr","France"],["de","Germany"],["pt","Portugal"],["it","Italy"],["ja","Japan"],["zh-CN","China (Simplified)"],["zh-TW","China (Traditional)"],["ar","Saudi Arabia"],["hi","India"],["ru","Russia"],["nl","Netherlands"],["pl","Poland"],["tr","Turkey"],["sv","Sweden"],["da","Denmark"],["fi","Finland"],["cs","Czech Republic"],["ro","Romania"],["hu","Hungary"],["el","Greece"],["th","Thailand"],["id","Indonesia"],["ms","Malaysia"],["vi","Vietnam"],["uk","Ukraine"],["fa","Iran"],["af","South Africa"],["sq","Albania"],["am","Ethiopia"],["hy","Armenia"],["az","Azerbaijan"],["be","Belarus"],["bn","Bangladesh"],["bs","Bosnia and Herzegovina"],["bg","Bulgaria"],["hr","Croatia"],["et","Estonia"],["ka","Georgia"],["ht","Haiti"],["is","Iceland"],["ga","Ireland"],["kn","India (Kannada)"],["kk","Kazakhstan"],["km","Cambodia"],["rw","Rwanda"],["lv","Latvia"],["lt","Lithuania"],["mk","North Macedonia"],["ml","India (Malayalam)"],["mt","Malta"],["mr","India (Marathi)"],["mn","Mongolia"],["my","Myanmar"],["ne","Nepal"],["pa","India (Punjabi)"],["sr","Serbia"],["sk","Slovakia"],["sw","Kenya"],["tl","Philippines"],["ta","India (Tamil)"],["te","India (Telugu)"],["yo","Nigeria"],["zu","South Africa (Zulu)"],["ca","Catalonia"],["gl","Galicia"],["eu","Basque Country"]];
const COUNTRY_GUIDE_LIST_30 = COUNTRY_GUIDE_LIST.slice(0, 30);
const COUNTRY_GUIDE_LIST_50 = COUNTRY_GUIDE_LIST.slice(0, 50);
const YT_SCOPE = "https://www.googleapis.com/auth/youtube";

const CMD1 = "타언어 혼입, 문맥의 부자연스러움, 기타 문제를 자동으로 꼼꼼이 검수해 줘.";
const CMD2 = "Number: 와 Country Name: 줄만 삭제해 줘.\n중요: 나머지 형식은 지금처럼 그대로 유지할 것(Country Code:, Title:, Description:)";
const CMD3 = "타언어 혼입, 문맥의 부자연스러움, 기타 문제를 한 번 더 검수해 줘.\n형식은 그대로 유지해 줘.";
const CMD4 = "Number, 국가명이 삭제되었는지 다시 검수하고, 타언어 혼입, 문맥의 부자연스러움, 기타 문제를 마지막으로 꼼꼼이 검수해 줘.";
const CMD5 = "아래로 이동해 줘.";

const PROMPT_TEMPLATE = `제미나이 의뢰문\n\n안녕 제미나이!\n아래 제목과 설명문을 {activeCount}개 국가 세트에 맞춰 자연스럽게 현지화 번역해 줘.\n처음부터 끝까지 중간에 끊지 말고 계속 번역해 줘.\n\n[원문]\nTitle: {title}\n\nDescription:\n{desc}\n\n[출력 형식]\nNumber: 순번\nCountry Code: 언어코드\nCountry Name: 영어 국가명\nTitle: 번역된 제목\nDescription:\n번역된 설명문\n\n[핵심 원칙]\n1. 처음부터 끝까지 절대 끊지 말고 계속 번역해 줘.\n2. 작업내용 설명, 머리말, 맺음말, 해설문은 넣지 말아 줘.\n3. 아래 대응표의 Country Code와 Country Name을 그대로 사용할 것\n4. 블록 순서는 절대 바꾸지 말 것\n5. 각 블록은 반드시 Country Code로 시작할 것\n6. Description의 문단 구조와 줄바꿈은 원문 흐름을 유지할 것\n7. 제목, 설명문 외의 군소리, 키워드 줄, 해시태그, 코드블록, HTML은 넣지 말 것\n8. 작업이 끝났으면 아래로 이동해 줘.\n\n[Country Code / Country Name 대응표]\n{countryGuide}\n\n[반드시 사용할 언어코드 및 순서]\n{codeList}\n`;

const $ = (id) => document.getElementById(id);

let ACTIVE_LIST = COUNTRY_GUIDE_LIST;
let ACTIVE_COUNT = 70;
let IS_TRIAL = false;
let IS_MOCK = false;
let accessToken = null;
let tokenClient = null;
let copied = false;

// ── 초기화 ──
function configureModeFromQuery() {
  const p = new URLSearchParams(location.search);
  IS_TRIAL = p.get("trial") === "1";
  IS_MOCK  = p.get("mock")  === "1";
  const count = p.get("count");
  if (IS_TRIAL || count === "30") { ACTIVE_LIST = COUNTRY_GUIDE_LIST_30; ACTIVE_COUNT = 30; }
  else if (count === "50")        { ACTIVE_LIST = COUNTRY_GUIDE_LIST_50; ACTIVE_COUNT = 50; }
  else                            { ACTIVE_LIST = COUNTRY_GUIDE_LIST;    ACTIVE_COUNT = 70; }
}

function initPlanOrder(count) {
  const n = parseInt(count);
  if (n === 30)      { ACTIVE_LIST = COUNTRY_GUIDE_LIST_30; ACTIVE_COUNT = 30; }
  else if (n === 50) { ACTIVE_LIST = COUNTRY_GUIDE_LIST_50; ACTIVE_COUNT = 50; }
  else               { ACTIVE_LIST = COUNTRY_GUIDE_LIST;    ACTIVE_COUNT = 70; }
  setProgress(0, `0 / ${ACTIVE_COUNT}`);
}

// ── 유틸 ──
function log(msg) {
  const box = $("deliveryLog");
  if (!box) return;
  box.value += `[${new Date().toLocaleTimeString("ko-KR")}] ${msg}\n`;
  box.scrollTop = box.scrollHeight;
}

function setProgress(pct, text) {
  if ($("progressBar"))     $("progressBar").style.width = `${pct}%`;
  if ($("progressPercent")) $("progressPercent").textContent = `${pct}%`;
  if ($("progressText"))    $("progressText").textContent = text;
}

function extractVideoId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const parts = u.pathname.split("/");
    const idx = parts.indexOf("shorts");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  } catch(e) {}
  return null;
}

function buildPrompt() {
  return PROMPT_TEMPLATE
    .replaceAll("{title}", ($("titleInput")?.value || "").trim() || "[제목을 입력해 주세요]")
    .replaceAll("{desc}",  ($("descInput")?.value  || "").trim() || "[설명문을 입력해 주세요]")
    .replaceAll("{countryGuide}", ACTIVE_LIST.map(([c,n],i) => `${i+1}. ${c} | ${n}`).join("\n"))
    .replaceAll("{activeCount}", String(ACTIVE_COUNT))
    .replaceAll("{codeList}", ACTIVE_LIST.map(([c]) => `"${c}"`).join(", "));
}

// ── 파싱: Gemini 출력 → localizations 맵 ──
function parseToLocalizationMap(text) {
  const lines = (text || "").replace(/\r/g, "").split("\n");
  const map = {};
  let cur = null;
  let mode = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const cc = line.match(/^Country Code:\s*(.+)$/i);
    if (cc) {
      if (cur && cur.code) map[cur.code] = { title: cur.title, description: cur.desc };
      cur = { code: cc[1].trim(), title: "", desc: "" };
      mode = null; continue;
    }
    if (!cur) continue;
    const ti = line.match(/^Title:\s*(.*)$/i);
    if (ti) { cur.title = ti[1].trim(); mode = null; continue; }
    if (/^Description:\s*$/i.test(line)) { mode = "desc"; continue; }
    if (/^(Country Name|Number|Nmber):\s*/i.test(line)) continue;
    if (mode === "desc") cur.desc += (cur.desc ? "\n" : "") + line;
  }
  if (cur && cur.code) map[cur.code] = { title: cur.title, description: cur.desc };
  return map;
}

// ── YouTube 전송 ──
async function sendToYouTube() {
  $("deliveryLog").value = "";

  const videoUrl = ($("videoUrl")?.value || "").trim();
  const videoId  = extractVideoId(videoUrl);
  if (!videoId) { alert("유튜브 영상 주소를 확인해 주세요."); return; }

  const rawText = ($("finalOutput")?.value || "").trim();
  const locMap  = parseToLocalizationMap(rawText);

  log("전체 발송 시작");
  log(`대상 videoId: ${videoId}`);
  setProgress(10, "전송 중...");

  const startTime = Date.now();
  const timer = setInterval(() => {
    const sec = Math.floor((Date.now() - startTime) / 1000);
    if ($("elapsedTime")) $("elapsedTime").textContent = `등록소요시간: ${sec}초`;
  }, 500);

  try {
    const res = await fetch("https://www.googleapis.com/youtube/v3/videos?part=localizations", {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: videoId, localizations: locMap })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "videos.update 실패");
    log("실등록 성공");
    setProgress(100, `완료`);
  } catch(e) {
    log(`실등록 실패: ${e.message}`);
    alert(`실등록 실패: ${e.message}`);
  } finally {
    clearInterval(timer);
    const sec = Math.floor((Date.now() - startTime) / 1000);
    if ($("elapsedTime")) $("elapsedTime").textContent = `등록소요시간: ${sec}초`;
  }
}

// ── OAuth ──
function initTokenClient() {
  const clientId = (($("clientIdSideInput")?.value || $("clientIdInput")?.value) || "").trim();
  if (!clientId) { alert("OAuth 클라이언트 ID를 입력해 주세요."); return false; }
  if ($("clientIdInput") && !$("clientIdInput").value) $("clientIdInput").value = clientId;
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId, scope: YT_SCOPE,
    callback: (resp) => {
      if (resp?.access_token) {
        accessToken = resp.access_token;
        if ($("authStatus"))     $("authStatus").value     = "구글 승인 완료\nAccess Token 수신 완료";
        if ($("authStatusSide")) $("authStatusSide").value = "구글 승인 완료\nAccess Token 수신 완료";
      } else {
        if ($("authStatus"))     $("authStatus").value     = "구글 승인 실패 또는 취소";
        if ($("authStatusSide")) $("authStatusSide").value = "구글 승인 실패 또는 취소";
      }
    }
  });
  return true;
}

// ── DOMContentLoaded ──
document.addEventListener("DOMContentLoaded", () => {
  configureModeFromQuery();
  const params = new URLSearchParams(location.search);
  const subscriber = params.get("subscriber") === "1";
  const plan = params.get("plan") || "monthly70";
  const count = params.get("count") || "70";

  initPlanOrder(count);

  const PLAN_LABEL = { monthly30:"30개국/월", monthly50:"50개국/월", monthly70:"70개국/월", annual70:"70개국/년" };
  if ($("currentPlanName")) $("currentPlanName").textContent = PLAN_LABEL[plan] || plan;

  // 명령어
  $("cmd1") && ($("cmd1").value = CMD1);
  $("cmd2") && ($("cmd2").value = CMD2);
  $("cmd3") && ($("cmd3").value = CMD3);
  $("cmd4") && ($("cmd4").value = CMD4);
  $("cmd5") && ($("cmd5").value = CMD5);

  // 번역의뢰문 생성
  $("submitBtn")?.addEventListener("click", () => {
    $("promptOutput").value = buildPrompt();
    $("copyPromptBtn")?.classList.remove("hidden");
    $("copyWarning")?.classList.remove("hidden");
    $("commandBlock")?.classList.remove("hidden");
    copied = false;
    $("chatTranslateBtn")?.classList.add("hidden");
  });

  // 초기화
  $("resetBtn")?.addEventListener("click", () => {
    ["videoUrl","titleInput","descInput","promptOutput","finalOutput","deliveryLog"].forEach(id => { if ($(id)) $(id).value = ""; });
    $("copyPromptBtn")?.classList.add("hidden");
    $("copyWarning")?.classList.add("hidden");
    $("commandBlock")?.classList.add("hidden");
    $("chatTranslateBtn")?.classList.add("hidden");
    setProgress(0, `0 / ${ACTIVE_COUNT}`);
    copied = false;
  });

  // 복사
  $("copyPromptBtn")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("promptOutput").value);
      copied = true;
      $("chatTranslateBtn")?.classList.remove("hidden");
      if ($("copyWarning")) $("copyWarning").textContent = "제미나이 번역의뢰문 복사가 완료되었습니다.";
    } catch { alert("복사에 실패했습니다."); }
  });

  $("chatTranslateBtn")?.addEventListener("click", () => {
    window.open("https://gemini.google.com/", "_blank", "noopener,noreferrer");
  });

  document.querySelectorAll(".mini-copy").forEach(btn => btn.addEventListener("click", async () => {
    const t = $(btn.dataset.copy);
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t.value);
      const old = btn.textContent;
      btn.textContent = "복사 완료";
      setTimeout(() => btn.textContent = old, 1200);
    } catch { alert("복사 실패"); }
  }));

  $("copyFinalBtn")?.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(($("finalOutput").value || "").trim()); alert("최종본이 복사되었습니다."); }
    catch { alert("복사 실패"); }
  });

  // OAuth 우측패널
  $("oauthStartBtnSide")?.addEventListener("click", () => {
    const clientId = ($("clientIdSideInput")?.value || "").trim();
    if (!clientId) { alert("OAuth 클라이언트 ID를 입력해 주세요."); return; }
    if ($("clientIdInput")) $("clientIdInput").value = clientId;
    const tc = google.accounts.oauth2.initTokenClient({
      client_id: clientId, scope: YT_SCOPE,
      callback: (resp) => {
        if (resp?.access_token) {
          accessToken = resp.access_token;
          if ($("authStatusSide")) $("authStatusSide").value = "구글 승인 완료\nAccess Token 수신 완료";
          if ($("authStatus"))     $("authStatus").value     = "구글 승인 완료\nAccess Token 수신 완료";
        } else {
          if ($("authStatusSide")) $("authStatusSide").value = "구글 승인 실패 또는 취소";
        }
      }
    });
    tc.requestAccessToken({ prompt: "consent" });
  });

  $("channelCheckBtnSide")?.addEventListener("click", async () => {
    if (!accessToken) { alert("먼저 구글 승인을 받아주세요."); return; }
    try {
      const res  = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      const item = data.items?.[0];
      if (!item) throw new Error("채널 정보를 찾지 못했습니다.");
      const msg = `구글 승인 완료\n채널 연결 확인됨\n채널명: ${item.snippet.title}\n채널 ID: ${item.id}`;
      if ($("authStatusSide")) $("authStatusSide").value = msg;
      if ($("authStatus"))     $("authStatus").value     = msg;
    } catch(e) {
      if ($("authStatusSide")) $("authStatusSide").value = `채널 연결 확인 실패\n${e.message}`;
    }
  });

  $("oauthStartBtn")?.addEventListener("click", () => { if (initTokenClient()) tokenClient.requestAccessToken({ prompt: "consent" }); });

  $("channelCheckBtn")?.addEventListener("click", async () => {
    if (!accessToken) { alert("먼저 구글 승인을 받아주세요."); $("openOauthGuideBtn")?.click(); return; }
    try {
      const res  = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      const item = data.items?.[0];
      if (!item) throw new Error("채널 정보를 찾지 못했습니다.");
      if ($("authStatus")) $("authStatus").value = `구글 승인 완료\n채널 연결 확인됨\n채널명: ${item.snippet.title}\n채널 ID: ${item.id}`;
    } catch(e) { if ($("authStatus")) $("authStatus").value = `채널 연결 확인 실패\n${e.message}`; }
  });

  $("openOauthGuideBtn")?.addEventListener("click",  () => $("oauthGuideModal")?.classList.remove("hidden"));
  $("closeOauthGuideBtn")?.addEventListener("click", () => $("oauthGuideModal")?.classList.add("hidden"));
  $("oauthGuideBackdrop")?.addEventListener("click", () => $("oauthGuideModal")?.classList.add("hidden"));
  $("holdGuideBtn")?.addEventListener("click",       () => $("holdGuideBox")?.classList.toggle("open"));
  $("upgradeBtn")?.addEventListener("click",         () => { location.href = "plans.html#annual"; });

  // ── 유튜브 자막 등록 ──
  $("sendOrderBtn")?.addEventListener("click", async () => {
    if (IS_TRIAL && IS_MOCK) {
      $("deliveryLog").value = "";
      log("모의 유튜브 채널 등록 시작");
      setProgress(50, "모의 등록 중...");
      setTimeout(() => { setProgress(100, "완료"); log("모의 등록 완료"); location.href = "trial_mock_result.html"; }, 600);
      return;
    }
    if (!accessToken) { alert("먼저 구글 승인을 받아주세요."); $("openOauthGuideBtn")?.click(); return; }
    await sendToYouTube();
  });
});
