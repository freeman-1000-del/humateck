// ============================================================
// ⚠️ 경고 1순위 — "en" (영어 디폴트) 절대 사용 금지
// YouTube 영상에 defaultLanguage: "en" 이 한 번 박제되면
// 해당 영상의 en 계열 자막이 영구적으로 비어버리는 재앙 발생.
// 코드 어디에도 "en" 을 기본값으로 쓰지 말 것.
// 전송 시 영상의 defaultLanguage 는 무조건 제외할 것.
// 이 주석을 절대 삭제하지 말 것.
// ============================================================

const COUNTRY_GUIDE_LIST = [["ko","South Korea"],["en-US","United States"],["en-GB","United Kingdom"],["es","Spain"],["fr","France"],["de","Germany"],["pt","Portugal"],["it","Italy"],["ja","Japan"],["zh-CN","China (Simplified)"],["zh-TW","China (Traditional)"],["ar","Saudi Arabia"],["hi","India"],["ru","Russia"],["nl","Netherlands"],["pl","Poland"],["tr","Turkey"],["sv","Sweden"],["da","Denmark"],["fi","Finland"],["cs","Czech Republic"],["ro","Romania"],["hu","Hungary"],["el","Greece"],["th","Thailand"],["id","Indonesia"],["ms","Malaysia"],["vi","Vietnam"],["uk","Ukraine"],["fa","Iran"],["af","South Africa"],["sq","Albania"],["am","Ethiopia"],["hy","Armenia"],["az","Azerbaijan"],["be","Belarus"],["bn","Bangladesh"],["bs","Bosnia and Herzegovina"],["bg","Bulgaria"],["hr","Croatia"],["et","Estonia"],["ka","Georgia"],["ht","Haiti"],["is","Iceland"],["ga","Ireland"],["kn","India (Kannada)"],["kk","Kazakhstan"],["km","Cambodia"],["rw","Rwanda"],["lv","Latvia"],["lt","Lithuania"],["mk","North Macedonia"],["ml","India (Malayalam)"],["mt","Malta"],["mr","India (Marathi)"],["mn","Mongolia"],["my","Myanmar"],["ne","Nepal"],["pa","India (Punjabi)"],["sr","Serbia"],["sk","Slovakia"],["sw","Kenya"],["tl","Philippines"],["ta","India (Tamil)"],["te","India (Telugu)"],["yo","Nigeria"],["zu","South Africa (Zulu)"],["ca","Catalonia"],["gl","Galicia"],["eu","Basque Country"]];
const COUNTRY_GUIDE_LIST_15 = COUNTRY_GUIDE_LIST.slice(0, 15);
const COUNTRY_GUIDE_LIST_30 = COUNTRY_GUIDE_LIST.slice(0, 30);
const COUNTRY_GUIDE_LIST_50 = COUNTRY_GUIDE_LIST.slice(0, 50);
const TRIAL_COUNTRY_GUIDE_LIST_30 = COUNTRY_GUIDE_LIST_30;
const CUSTOMER_TOTAL_COUNT = 70;
const YT_SCOPE = "https://www.googleapis.com/auth/youtube";
const DEFAULT_VIDEO_LANGUAGE = "";

let ACTIVE_COUNTRY_GUIDE_LIST = COUNTRY_GUIDE_LIST;
let ACTIVE_TOTAL_COUNT = CUSTOMER_TOTAL_COUNT;
let IS_TRIAL_MODE = false;
let IS_MOCK_MODE = false;

function configureModeFromQuery() {
  const params = new URLSearchParams(location.search);
  IS_TRIAL_MODE = params.get("trial") === "1";
  IS_MOCK_MODE = params.get("mock") === "1";
  const count = params.get("count");
  if (IS_TRIAL_MODE) {
    ACTIVE_COUNTRY_GUIDE_LIST = COUNTRY_GUIDE_LIST_30;
    ACTIVE_TOTAL_COUNT = 30;
  } else if (count === "30") {
    ACTIVE_COUNTRY_GUIDE_LIST = COUNTRY_GUIDE_LIST_30;
    ACTIVE_TOTAL_COUNT = 30;
  } else if (count === "50") {
    ACTIVE_COUNTRY_GUIDE_LIST = COUNTRY_GUIDE_LIST_50;
    ACTIVE_TOTAL_COUNT = 50;
  } else {
    ACTIVE_COUNTRY_GUIDE_LIST = COUNTRY_GUIDE_LIST;
    ACTIVE_TOTAL_COUNT = CUSTOMER_TOTAL_COUNT;
  }
}


// plans.html에서 플랜 선택 시 호출 - 전역 변수 동적 업데이트
function initPlanOrder(count, plan) {
  const n = parseInt(count);
  if (n === 30) {
    ACTIVE_COUNTRY_GUIDE_LIST = COUNTRY_GUIDE_LIST_30;
    ACTIVE_TOTAL_COUNT = 30;
  } else if (n === 50) {
    ACTIVE_COUNTRY_GUIDE_LIST = COUNTRY_GUIDE_LIST_50;
    ACTIVE_TOTAL_COUNT = 50;
  } else {
    ACTIVE_COUNTRY_GUIDE_LIST = COUNTRY_GUIDE_LIST;
    ACTIVE_TOTAL_COUNT = 70;
  }
  setProgress(0, `0 / ${ACTIVE_TOTAL_COUNT}`);
  const pt = document.getElementById("progressText");
  if (pt) pt.textContent = `0 / ${ACTIVE_TOTAL_COUNT}`;
}

function activeCountryGuide() {
  return ACTIVE_COUNTRY_GUIDE_LIST.map(([code,name],i) => `${i+1}. ${code} | ${name}`).join("\n");
}
function activeCodeList() {
  return ACTIVE_COUNTRY_GUIDE_LIST.map(([code]) => `"${code}"`).join(", ");
}

const CMD1 = "타언어 혼입, 문맥의 부자연스러움, 기타 문제를 자동으로 꼼꼼이 검수해 줘.";
const CMD2 = "Number: 와 Country Name: 줄만 삭제해 줘.\n중요: 나머지 형식은 지금처럼 그대로 유지할 것(Country Code:, Title:, Description:)";
const CMD3 = "타언어 혼입, 문맥의 부자연스러움, 기타 문제를 한 번 더 검수해 줘.\n형식은 그대로 유지해 줘.";
const CMD4 = 국가명이 삭제되었는지 다시 검수하고, 타언어 혼입, 문맥의 부자연스러움, 기타 문제를 다시 한 번 꼼꼼이 검수해 줘.";
const CMD5 = number를 붙여 전체 번역 코드수를 집계해 봐.";
const CMD6 = 전체 숫자가 맞으면 number를 모두 지우고, 타언어 혼입, 문맥의 부자연스러움, 기타 문제를 마지막으로 꼼꼼히 검수해 줘.";
const CMD7 = "아래로 이동해 줘.";

const PROMPT_TEMPLATE = `제미나이 의뢰문\n\n안녕 제미나이!\n아래 제목과 설명문을 {activeCount}개 국가 세트에 맞춰 자연스럽게 현지화 번역해 줘.\n처음부터 끝까지 중간에 끊지 말고 계속 번역해 줘.\n\n[원문]\nTitle: {title}\n\nDescription:\n{desc}\n\n[출력 형식]\nNumber: 순번\nCountry Code: 언어코드\nCountry Name: 영어 국가명\nTitle: 번역된 제목\nDescription:\n번역된 설명문\n\n[핵심 원칙]\n1. 처음부터 끝까지 절대 끊지 말고 계속 번역해 줘.\n2. 작업내용 설명, 머리말, 맺음말, 해설문은 넣지 말아 줘.\n3. 아래 대응표의 Country Code와 Country Name을 그대로 사용할 것\n4. 블록 순서는 절대 바꾸지 말 것\n5. 각 블록은 반드시 Country Code로 시작할 것\n6. Description의 문단 구조와 줄바꿈은 원문 흐름을 유지할 것\n7. 제목, 설명문 외의 군소리, 키워드 줄, 해시태그, 코드블록, HTML은 넣지 말 것\n8. 작업이 끝났으면 아래로 이동해 줘.\n\n[Country Code / Country Name 대응표]\n{countryGuide}\n\n[반드시 사용할 언어코드 및 순서]\n{codeList}\n`;

const $ = (id) => document.getElementById(id);
const SUBSCRIBER_PROFILE_DEMO = {
  monthly70: {label:"70개국 / 32,500원 / 월", status:"active", renewDate:"2026-05-07"},
  monthly50: {label:"50개국 / 25,000원 / 월", status:"active", renewDate:"2026-05-07"},
  monthly30: {label:"30개국 / 16,500원 / 월", status:"active", renewDate:"2026-05-07"},
  cancelled70: {label:"70개국 / 32,500원 / 월", status:"cancelled", endDate:"2026-05-07"}
};
let copied = false;
let tokenClient = null;
let accessToken = null;

function log(msg) {
  const box = $("deliveryLog");
  if (!box) return;
  const now = new Date().toLocaleTimeString("ko-KR");
  box.value += `[${now}] ${msg}\n`;
  box.scrollTop = box.scrollHeight;
}

function buildPrompt() {
  return PROMPT_TEMPLATE
    .replaceAll("{title}", ($("titleInput")?.value || "").trim() || "[제목을 입력해 주세요]")
    .replaceAll("{desc}", ($("descInput")?.value || "").trim() || "[설명문을 입력해 주세요]")
    .replaceAll("{countryGuide}", activeCountryGuide())
    .replaceAll("{activeCount}", String(ACTIVE_TOTAL_COUNT))
    .replaceAll("{codeList}", activeCodeList());
}

function extractVideoId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "") || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const parts = u.pathname.split("/");
    const idx = parts.indexOf("shorts");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  } catch(e) {}
  return null;
}

function parseFinalText(text) {
  const lines = (text || "").replace(/\r/g, "").split("\n");
  const items = [];
  let cur = null;
  let mode = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const cc = line.match(/^Country Code:\s*(.+)$/i);
    if (cc) { if (cur) items.push(cur); cur = { code: cc[1].trim(), title: "", description: "" }; mode = null; continue; }
    if (!cur) continue;
    const ti = line.match(/^Title:\s*(.*)$/i);
    if (ti) { cur.title = ti[1].trim(); mode = null; continue; }
    if (/^Description:\s*$/i.test(line)) { mode = "description"; continue; }
    if (/^Country Name:\s*/i.test(line) || /^Number:\s*/i.test(line) || /^Nmber:\s*/i.test(line)) continue;
    if (mode === "description") cur.description += (cur.description ? "\n" : "") + line;
  }
  if (cur) items.push(cur);
  return items.filter(x => x.code && x.title);
}

function buildLocalizationMap(items) {
  const map = {};
  items.slice(0, ACTIVE_TOTAL_COUNT).forEach(item => {
    map[item.code] = { title: item.title || "", description: item.description || "" };
  });
  return map;
}

function initTokenClient() {
  const clientId = (($("clientIdSideInput")?.value || $("clientIdInput")?.value) || "").trim();
  if (!clientId) {
    alert("아직 구글 승인을 받지 않으셨습니다. (최초 1회) 구글 승인 받으러 가기 버튼을 눌러 주세요.");
    $("openOauthGuideBtn")?.click();
    return false;
  }
  if ($("clientIdInput") && !$("clientIdInput").value) $("clientIdInput").value = clientId;
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: YT_SCOPE,
    callback: (resp) => {
      if (resp && resp.access_token) {
        accessToken = resp.access_token;
        $("authStatus").value = "구글 승인 완료\nAccess Token 수신 완료";
      } else {
        $("authStatus").value = "구글 승인 실패 또는 취소";
      }
    }
  });
  return true;
}

async function fetchVideo(videoId) {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,localizations&id=${encodeURIComponent(videoId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "videos.list 실패");
  const item = data.items && data.items[0];
  if (!item) throw new Error("대상 영상을 찾지 못했습니다.");
  return item;
}

async function updateVideoLocalizations(videoId, existingVideo, mergedLocalizations) {
  const existingSnippet = existingVideo.snippet || {};
  const defaultLanguage = existingSnippet.defaultLanguage || "";
  if (!existingSnippet.title) throw new Error("기존 영상의 snippet.title을 찾지 못했습니다.");
  if (!existingSnippet.categoryId) throw new Error("기존 영상의 snippet.categoryId를 찾지 못했습니다.");
  const body = {
    id: videoId,
    snippet: {
      title: existingSnippet.title,
      categoryId: existingSnippet.categoryId,
      defaultLanguage: defaultLanguage
    },
    localizations: mergedLocalizations
  };
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/videos?part=snippet,localizations",
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "videos.update 실패");
  return data;
}
async function sendLocalizations() {
  $("deliveryLog").value = "";
  if (!accessToken) { alert("먼저 구글 승인을 진행해 주세요."); return; }
  const videoUrl = ($("videoUrl")?.value || "").trim();
  const videoId = extractVideoId(videoUrl);
  if (!videoId) { alert("유튜브 영상 주소에서 videoId를 찾지 못했습니다."); return; }
  const finalText = ($("finalOutput")?.value || "").trim();
  const items = parseFinalText(finalText);
  if (!items.length) { alert("제미나이 최종본을 붙여넣어 주세요."); return; }
  log(`대상 videoId: ${videoId}`);
  const startTime = Date.now();
  const elapsedTimer = setInterval(() => {
    const sec = Math.floor((Date.now() - startTime) / 1000);
    if ($("elapsedTime")) $("elapsedTime").textContent = `등록소요시간: ${sec}초`;
  }, 500);
  try {
    const existing = await fetchVideo(videoId);
    const defaultLang = existing.snippet?.defaultLanguage || "";
    const newMap = {};
    items.forEach(item => {
      if (item.code && item.code.toLowerCase() !== defaultLang.toLowerCase()) {
        newMap[item.code] = { title: item.title || "", description: item.description || "" };
      }
    });
    if (!Object.keys(newMap).length) throw new Error("전송할 번역 언어가 없습니다.");
    const merged = Object.assign({}, existing.localizations || {}, newMap);
    log(`전송 언어 수: ${Object.keys(newMap).length}`);
    await updateVideoLocalizations(videoId, existing, merged);
    log("videos.update 전송 완료");
    const verify = await fetchVideo(videoId);
    log(`실등록 언어수: ${Object.keys(newMap).length}개`);
    log("실등록 성공");
    setProgress(100, `${ACTIVE_TOTAL_COUNT} / ${ACTIVE_TOTAL_COUNT}`);
  } catch(e) {
    log(`실등록 실패: ${e.message}`);
    alert(`실등록 실패: ${e.message}`);
  } finally {
    clearInterval(elapsedTimer);
    const sec = Math.floor((Date.now() - startTime) / 1000);
    if ($("elapsedTime")) $("elapsedTime").textContent = `등록소요시간: ${sec}초`;
  }
}
function setProgress(percent, text) {
  if ($("progressBar")) $("progressBar").style.width = `${percent}%`;
  if ($("progressPercent")) $("progressPercent").textContent = `${percent}%`;
  if ($("progressText")) $("progressText").textContent = text;
}

// 커스텀 확인 모달
function showSubmitModal(onConfirm) {
  const modal = $("submitConfirmModal");
  if (!modal) { onConfirm(); return; }
  modal.classList.remove("hidden");
  $("submitModalOkBtn").onclick = () => { modal.classList.add("hidden"); onConfirm(); };
  $("submitModalCancelBtn").onclick = () => modal.classList.add("hidden");
}


document.addEventListener("DOMContentLoaded", () => {
  configureModeFromQuery();
  const params = new URLSearchParams(location.search);
  const subscriber = params.get("subscriber") === "1";
  const plan = params.get("plan") || "monthly70";

  const PLAN_LABEL_MAP = {
    monthly30: "30개국 / 16,500원 / 월",
    monthly50: "50개국 / 25,000원 / 월",
    monthly70: "70개국 / 32,500원 / 월",
    annual70:  "70개국 / 292,500원 / 년",
  };
  if ($("currentPlanName")) {
    if (subscriber) {
      const prof = SUBSCRIBER_PROFILE_DEMO[plan] || SUBSCRIBER_PROFILE_DEMO.monthly70;
      $("currentPlanName").textContent = prof.label;
      if ($("upgradeBtn")) $("upgradeBtn").classList.remove("hidden");
      if ($("monthlySignupBtn")) $("monthlySignupBtn").classList.add("hidden");
      if ($("sendOrderBtn")) $("sendOrderBtn").textContent = "유튜브 자막 등록하기";
      if ($("contractDateText")) {
        $("contractDateText").textContent = prof.status === "cancelled"
          ? `구독취소 예정 · 종료일: ${prof.endDate}`
          : `자동연장일: ${prof.renewDate}`;
      }
    } else if (!IS_TRIAL_MODE && plan && PLAN_LABEL_MAP[plan]) {
      $("currentPlanName").textContent = PLAN_LABEL_MAP[plan];
      if ($("contractDateText")) $("contractDateText").textContent = `선택 플랜: ${ACTIVE_TOTAL_COUNT}개국`;
      if ($("upgradeBtn")) $("upgradeBtn").classList.add("hidden");
    }
  }

  if ($("trialModeInfoBox") && IS_TRIAL_MODE) {
    $("trialModeInfoBox").classList.remove("hidden");
    if ($("currentPlanName")) $("currentPlanName").textContent = "30개국 / 무료/ 7일";
    if ($("upgradeBtn")) $("upgradeBtn").classList.add("hidden");
    if ($("monthlySignupBtn")) $("monthlySignupBtn").classList.remove("hidden");
    if (IS_MOCK_MODE) {
      $("trialModeInfoText").textContent = "현재는 30개국 / 7일간 무료체험의 '유튜브채널 모의등록' 모드입니다.";
      $("trialModeActionRow").innerHTML = '<span class="muted" style="align-self:center;">실제 유튜브 등록체험을 원하실 경우</span><a class="btn btn-light" href="order.html?trial=1&count=30&mock=0&mode=chat">유튜브채널 실등록 바로 가기</a>';
      if ($("youtubeFaqBox")) $("youtubeFaqBox").classList.add("hidden");
      if ($("openOauthGuideBtn")) $("openOauthGuideBtn").classList.add("hidden");
    } else {
      $("trialModeInfoText").textContent = "현재는 30개국 / 7일간 무료체험의 '유튜브 채널 실등록' 모드입니다.";
      $("trialModeActionRow").innerHTML = '<span class="muted" style="align-self:center;">모의 유튜브 등록체험을 원하실 경우</span><a class="btn btn-light" href="order.html?trial=1&count=30&mock=1&mode=chat">유튜브채널 모의등록 바로 가기</a>';
      if ($("youtubeFaqBox")) $("youtubeFaqBox").classList.remove("hidden");
      if ($("openOauthGuideBtn")) $("openOauthGuideBtn").classList.remove("hidden");
    }
    if ($("sendOrderBtn")) $("sendOrderBtn").textContent = "유튜브 자막 등록하기";
  }
  if ($("youtubeFaqBox") && !IS_TRIAL_MODE) $("youtubeFaqBox").classList.remove("hidden");

  $("cmd1") && ($("cmd1").value = CMD1);
  $("cmd2") && ($("cmd2").value = CMD2);
  $("cmd3") && ($("cmd3").value = CMD3);
  $("cmd4") && ($("cmd4").value = CMD4);
  $("cmd5") && ($("cmd5").value = CMD5);
  setProgress(0, `0 / ${ACTIVE_TOTAL_COUNT}`);

  $("upgradeBtn")?.addEventListener("click", () => {
    location.href = "plans.html#annual";
  });

  $("openOauthGuideBtn")?.addEventListener("click", () => $("oauthGuideModal")?.classList.remove("hidden"));
  $("closeOauthGuideBtn")?.addEventListener("click", () => $("oauthGuideModal")?.classList.add("hidden"));
  $("oauthGuideBackdrop")?.addEventListener("click", () => $("oauthGuideModal")?.classList.add("hidden"));
  $("holdGuideBtn")?.addEventListener("click", () => $("holdGuideBox")?.classList.toggle("open"));
  // 우측 패널 직접 승인
  $("oauthStartBtnSide")?.addEventListener("click", () => {
    const clientId = ($("clientIdSideInput")?.value || "").trim();
    if (!clientId) { alert("OAuth 클라이언트 ID를 입력해 주세요."); return; }
    if ($("clientIdInput")) $("clientIdInput").value = clientId;
    const tc = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: YT_SCOPE,
      callback: (resp) => {
        if (resp && resp.access_token) {
          accessToken = resp.access_token;
          if ($("authStatusSide")) $("authStatusSide").value = "구글 승인 완료\nAccess Token 수신 완료";
          if ($("authStatus")) $("authStatus").value = "구글 승인 완료\nAccess Token 수신 완료";
        } else {
          if ($("authStatusSide")) $("authStatusSide").value = "구글 승인 실패 또는 취소";
        }
      }
    });
    tc.requestAccessToken({ prompt: "consent" });
  });

  $("channelCheckBtnSide")?.addEventListener("click", async () => {
    if (!accessToken) { alert("아직 구글 승인을 받지 않으셨습니다."); return; }
    try {
      const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      const item = data.items && data.items[0];
      if (!item) throw new Error("채널 정보를 찾지 못했습니다.");
      const msg = `구글 승인 완료\n채널 연결 확인됨\n채널명: ${item.snippet.title}\n채널 ID: ${item.id}`;
      if ($("authStatusSide")) $("authStatusSide").value = msg;
      if ($("authStatus")) $("authStatus").value = msg;
    } catch (e) {
      if ($("authStatusSide")) $("authStatusSide").value = `채널 연결 확인 실패\n${e.message}`;
    }
  });
  $("copySideIdToModalBtn")?.addEventListener("click", () => {
    if ($("clientIdSideInput")?.value && $("clientIdInput")) $("clientIdInput").value = $("clientIdSideInput").value;
    $("openOauthGuideBtn")?.click();
  });
  $("oauthDirectApproveBtn")?.addEventListener("click", () => {
    $("openOauthGuideBtn")?.click();
    if ($("authStatus")) $("authStatus").value = "구글 승인 완료";
  });

  $("submitBtn")?.addEventListener("click", () => {
    showSubmitModal(() => {
      $("promptOutput").value = buildPrompt();
      $("copyPromptBtn")?.classList.remove("hidden");
      $("copyWarning")?.classList.add("hidden");
      $("commandBlock")?.classList.remove("hidden");
      copied = false;
      $("chatTranslateBtn")?.classList.add("hidden");
    });
  });

  $("resetBtn")?.addEventListener("click", () => {
    ["videoUrl","titleInput","descInput","promptOutput","finalOutput","deliveryLog"].forEach(id => { if ($(id)) $(id).value = ""; });
    $("copyPromptBtn")?.classList.add("hidden");
    $("copyWarning")?.classList.add("hidden");
    $("commandBlock")?.classList.add("hidden");
    $("chatTranslateBtn")?.classList.add("hidden");
    setProgress(0, `0 / ${ACTIVE_TOTAL_COUNT}`);
    copied = false;
  });

  $("copyPromptBtn")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("promptOutput").value);
      copied = true;
      $("chatTranslateBtn")?.classList.remove("hidden");
      $("copyWarning").textContent = "제미나이 번역의뢰문 복사가 완료되었습니다.";
    } catch { alert("복사에 실패했습니다."); }
  });

  $("chatTranslateBtn")?.addEventListener("click", () => {
    if (!copied) { alert("먼저 제미나이 번역의뢰문 복사를 눌러 주세요."); return; }
    window.open("https://gemini.google.com/", "_blank", "noopener,noreferrer");
    alert("챗 번역 새 탭을 열었습니다. 복사한 의뢰문과 아래 명령어를 순서대로 붙여넣어 주세요.");
  });

  document.querySelectorAll(".mini-copy").forEach(btn => btn.addEventListener("click", async () => {
    const target = $(btn.dataset.copy);
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target.value);
      const old = btn.textContent;
      btn.textContent = "복사 완료";
      setTimeout(() => btn.textContent = old, 1200);
    } catch { alert("명령어 복사에 실패했습니다."); }
  }));

  $("copyFinalBtn")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(($("finalOutput").value || "").trim());
      alert("최종본이 복사되었습니다.");
    } catch { alert("최종본 복사에 실패했습니다."); }
  });

  $("oauthStartBtn")?.addEventListener("click", () => {
    if (!initTokenClient()) return;
    tokenClient.requestAccessToken({ prompt: "consent" });
  });

  $("channelCheckBtn")?.addEventListener("click", async () => {
    if (!accessToken) { alert("아직 구글 승인을 받지 않으셨습니다."); $("openOauthGuideBtn")?.click(); return; }
    try {
      const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      const item = data.items && data.items[0];
      if (!item) throw new Error("채널 정보를 찾지 못했습니다.");
      $("authStatus").value = `구글 승인 완료\n채널 연결 확인됨\n채널명: ${item.snippet.title}\n채널 ID: ${item.id}`;
    } catch (e) { $("authStatus").value = `채널 연결 확인 실패\n${e.message}`; }
  });

  $("sendOrderBtn")?.addEventListener("click", async () => {
    if (IS_TRIAL_MODE && IS_MOCK_MODE) {
      $("deliveryLog").value = "";
      log("모의 유튜브 채널 등록 시작");
      log(`입력 언어: ${ACTIVE_TOTAL_COUNT}개`);
      setProgress(30, `10 / ${ACTIVE_TOTAL_COUNT}`);
      setTimeout(() => { setProgress(65, `20 / ${ACTIVE_TOTAL_COUNT}`); }, 300);
      setTimeout(() => { setProgress(100, `${ACTIVE_TOTAL_COUNT} / ${ACTIVE_TOTAL_COUNT}`); log("모의 등록 완료"); location.href = "trial_mock_result.html"; }, 650);
      return;
    }
    await sendLocalizations();
  });
});