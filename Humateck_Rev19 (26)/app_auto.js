const COUNTRY_GUIDE_LIST = [["ko","South Korea"],["en-US","United States"],["en-GB","United Kingdom"],["es","Spain"],["fr","France"],["de","Germany"],["pt","Portugal"],["it","Italy"],["ja","Japan"],["zh-CN","China (Simplified)"],["zh-TW","China (Traditional)"],["ar","Saudi Arabia"],["hi","India"],["ru","Russia"],["nl","Netherlands"],["pl","Poland"],["tr","Turkey"],["sv","Sweden"],["da","Denmark"],["fi","Finland"],["cs","Czech Republic"],["ro","Romania"],["hu","Hungary"],["el","Greece"],["th","Thailand"],["id","Indonesia"],["ms","Malaysia"],["vi","Vietnam"],["uk","Ukraine"],["fa","Iran"],["af","South Africa"],["sq","Albania"],["am","Ethiopia"],["hy","Armenia"],["az","Azerbaijan"],["be","Belarus"],["bn","Bangladesh"],["bs","Bosnia and Herzegovina"],["bg","Bulgaria"],["hr","Croatia"],["et","Estonia"],["ka","Georgia"],["ht","Haiti"],["is","Iceland"],["ga","Ireland"],["kn","India (Kannada)"],["kk","Kazakhstan"],["km","Cambodia"],["rw","Rwanda"],["lv","Latvia"],["lt","Lithuania"],["mk","North Macedonia"],["ml","India (Malayalam)"],["mt","Malta"],["mr","India (Marathi)"],["mn","Mongolia"],["my","Myanmar"],["ne","Nepal"],["pa","India (Punjabi)"],["sr","Serbia"],["sk","Slovakia"],["sw","Kenya"],["tl","Philippines"],["ta","India (Tamil)"],["te","India (Telugu)"],["yo","Nigeria"],["zu","South Africa (Zulu)"],["ca","Catalonia"],["gl","Galicia"],["eu","Basque Country"]];
const COUNTRY_GUIDE_LIST_50 = COUNTRY_GUIDE_LIST.slice(0, 50);
const COUNTRY_GUIDE_LIST_30 = COUNTRY_GUIDE_LIST.slice(0, 30);
const CUSTOMER_TOTAL_COUNT = 70;
const YT_SCOPE = "https://www.googleapis.com/auth/youtube";
const ROOT_PREFIX = "";
const AUTO_TRANSLATE_ENDPOINT = "/api/openai_translate_auto";

let ACTIVE_COUNTRY_GUIDE_LIST = COUNTRY_GUIDE_LIST;
let ACTIVE_TOTAL_COUNT = CUSTOMER_TOTAL_COUNT;
let IS_TRIAL_MODE = false;
let IS_MOCK_MODE = false;
let tokenClient = null;
let accessToken = null;
let autoTranslateInFlight = false;

const $ = (id) => document.getElementById(id);
const SUBSCRIBER_PROFILE_DEMO = {
  monthly70: { label: "70개국 / 32,500원 / 월", status: "active", renewDate: "2026-05-07" },
  monthly50: { label: "50개국 / 25,000원 / 월", status: "active", renewDate: "2026-05-07" },
  monthly30: { label: "30개국 / 16,500원 / 월", status: "active", renewDate: "2026-05-07" },
  cancelled70: { label: "70개국 / 32,500원 / 월", status: "cancelled", endDate: "2026-05-07" }
};

function configureModeFromQuery() {
  const params = new URLSearchParams(location.search);
  IS_TRIAL_MODE = params.get("trial") === "1";
  IS_MOCK_MODE = params.get("mock") === "1";
  const count = params.get("count");
  if (IS_TRIAL_MODE || count === "30") {
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

function activeCountryList() {
  return ACTIVE_COUNTRY_GUIDE_LIST.map(([code, country]) => ({ code, country }));
}

function log(msg) {
  const box = $("deliveryLog");
  if (!box) return;
  const now = new Date().toLocaleTimeString("ko-KR");
  box.value += `[${now}] ${msg}\n`;
  box.scrollTop = box.scrollHeight;
}

function setStatus(text) {
  if ($("autoStatus")) $("autoStatus").value = text;
}

function setAutoBusy(isBusy) {
  autoTranslateInFlight = isBusy;
  if ($("submitBtn")) {
    $("submitBtn").disabled = isBusy;
    $("submitBtn").textContent = isBusy ? "자동번역 진행 중..." : "제출하기";
  }
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
  } catch (e) {}
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
    if (cc) {
      if (cur) items.push(cur);
      cur = { code: cc[1].trim(), title: "", description: "" };
      mode = null;
      continue;
    }
    if (!cur) continue;
    const ti = line.match(/^Title:\s*(.*)$/i);
    if (ti) {
      cur.title = ti[1].trim();
      mode = null;
      continue;
    }
    if (/^Description:\s*$/i.test(line)) {
      mode = "description";
      continue;
    }
    if (/^Country Name:\s*/i.test(line) || /^Number:\s*/i.test(line) || /^Nmber:\s*/i.test(line)) continue;
    if (mode === "description") cur.description += (cur.description ? "\n" : "") + line;
  }
  if (cur) items.push(cur);
  return items.filter((x) => x.code && x.title);
}

function buildLocalizationMap(items) {
  const map = {};
  items.slice(0, ACTIVE_TOTAL_COUNT).forEach((item) => {
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
        if ($("authStatus")) $("authStatus").value = "구글 승인 완료\nAccess Token 수신 완료";
      } else if ($("authStatus")) {
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
  const res = await fetch("https://www.googleapis.com/youtube/v3/videos?part=snippet,localizations", {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "videos.update 실패");
  return data;
}

async function sendLocalizations() {
  $("deliveryLog").value = "";
  if (!accessToken) {
    alert("먼저 구글 승인을 진행해 주세요.");
    return;
  }
  const videoUrl = ($("videoUrl")?.value || "").trim();
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    alert("유튜브 영상 주소에서 videoId를 찾지 못했습니다.");
    return;
  }
  const finalText = ($("finalOutput")?.value || "").trim();
  const items = parseFinalText(finalText);
  if (!items.length) {
    alert("자동번역 결과가 비어 있습니다. 먼저 제출하기를 눌러 주세요.");
    return;
  }
  log(`대상 videoId: ${videoId}`);
  const startTime = Date.now();
  try {
    const existing = await fetchVideo(videoId);
    const defaultLang = existing.snippet?.defaultLanguage || "";
    const newMap = {};
    items.forEach((item) => {
      if (item.code && item.code.toLowerCase() !== defaultLang.toLowerCase()) {
        newMap[item.code] = { title: item.title || "", description: item.description || "" };
      }
    });
    if (!Object.keys(newMap).length) throw new Error("전송할 번역 언어가 없습니다.");
    const merged = Object.assign({}, existing.localizations || {}, newMap);
    log(`전송 언어 수: ${Object.keys(newMap).length}`);
    await updateVideoLocalizations(videoId, existing, merged);
    log("videos.update 전송 완료");
    log(`실등록 언어수: ${Object.keys(newMap).length}개`);
    log("실등록 성공");
  } catch (e) {
    log(`실등록 실패: ${e.message}`);
    alert(`실등록 실패: ${e.message}`);
  } finally {
    const sec = Math.floor((Date.now() - startTime) / 1000);
    log(`등록소요시간: ${sec}초`);
  }
}

async function requestAutoTranslation(title, description) {
  const res = await fetch(AUTO_TRANSLATE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      description,
      countries: activeCountryList(),
      count: ACTIVE_TOTAL_COUNT
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `자동번역 호출 실패 (${res.status})`);
  if (!data.finalText) throw new Error("자동번역 응답에 finalText가 없습니다.");
  return data;
}

async function startAutoTranslation() {
  const title = ($("titleInput")?.value || "").trim();
  const description = ($("descInput")?.value || "").trim();
  if (!title) {
    alert("원문 제목을 입력해 주세요.");
    $("titleInput")?.focus();
    return;
  }
  if (!description) {
    alert("원문 설명문을 입력해 주세요.");
    $("descInput")?.focus();
    return;
  }

  setAutoBusy(true);
  setStatus(`자동번역 진행 중...\n대상 언어 수: ${ACTIVE_TOTAL_COUNT}개`);
  if ($("finalOutput")) $("finalOutput").value = "";

  try {
    const data = await requestAutoTranslation(title, description);
    if ($("finalOutput")) $("finalOutput").value = data.finalText || "";
    const items = parseFinalText(data.finalText || "");
    const countText = items.length ? `${items.length}개 언어 생성 완료` : "응답 생성 완료";
    setStatus(`자동번역 완료\n${countText}${data.model ? `\n모델: ${data.model}` : ""}`);
    if (!items.length) {
      throw new Error("자동번역 결과 형식을 읽지 못했습니다. 서버 응답을 확인해 주세요.");
    }
  } catch (e) {
    setStatus(`자동번역 실패\n${e.message}`);
    alert(`자동번역 실패: ${e.message}`);
  } finally {
    setAutoBusy(false);
  }
}

function showSubmitModal(onConfirm) {
  const modal = $("submitConfirmModal");
  if (!modal) {
    onConfirm();
    return;
  }
  modal.classList.remove("hidden");
  const okBtn = $("submitModalOkBtn");
  if (okBtn) {
    okBtn.onclick = () => {
      modal.classList.add("hidden");
      onConfirm();
    };
  }
  const backdrop = $("submitModalBackdrop");
  if (backdrop) {
    backdrop.onclick = () => modal.classList.add("hidden");
  }
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
    annual70:  "70개국 / 292,500원 / 년"
  };

  if ($("centerTitle")) $("centerTitle").textContent = "최종번역본";
  setStatus("제출하기를 누르면 자동번역이 진행됩니다.");

  if ($("currentPlanName")) {
    if (subscriber) {
      const prof = SUBSCRIBER_PROFILE_DEMO[plan] || SUBSCRIBER_PROFILE_DEMO.monthly70;
      $("currentPlanName").textContent = prof.label;
      if ($("upgradeBtn")) $("upgradeBtn").classList.remove("hidden");
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
    if (IS_MOCK_MODE) {
      $("trialModeInfoText").textContent = "현재는 30개국 / 7일간 무료체험의 '유튜브채널 모의등록' 모드입니다.";
      $("trialModeActionRow").innerHTML = '<span class="muted" style="align-self:center;">실제 유튜브 등록체험을 원하실 경우</span><a class="btn btn-light" href="order_auto.html?trial=1&count=30&mock=0&mode=auto">유튜브채널 실등록 바로 가기</a>';
      if ($("youtubeFaqBox")) $("youtubeFaqBox").classList.add("hidden");
      if ($("openOauthGuideBtn")) $("openOauthGuideBtn").classList.add("hidden");
    } else {
      $("trialModeInfoText").textContent = "현재는 30개국 / 7일간 무료체험의 '유튜브 채널 실등록' 모드입니다.";
      $("trialModeActionRow").innerHTML = '<span class="muted" style="align-self:center;">모의 유튜브 등록체험을 원하실 경우</span><a class="btn btn-light" href="order_auto.html?trial=1&count=30&mock=1&mode=auto">유튜브채널 모의등록 바로 가기</a>';
      if ($("youtubeFaqBox")) $("youtubeFaqBox").classList.remove("hidden");
      if ($("openOauthGuideBtn")) $("openOauthGuideBtn").classList.remove("hidden");
    }
  }
  if ($("youtubeFaqBox") && !IS_TRIAL_MODE) $("youtubeFaqBox").classList.remove("hidden");

  $("upgradeBtn")?.addEventListener("click", () => {
    location.href = `${ROOT_PREFIX}plans_auto.html#annual`;
  });

  $("openOauthGuideBtn")?.addEventListener("click", () => $("oauthGuideModal")?.classList.remove("hidden"));
  $("closeOauthGuideBtn")?.addEventListener("click", () => $("oauthGuideModal")?.classList.add("hidden"));
  $("oauthGuideBackdrop")?.addEventListener("click", () => $("oauthGuideModal")?.classList.add("hidden"));
  $("holdGuideBtn")?.addEventListener("click", () => $("holdGuideBox")?.classList.toggle("open"));

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
        } else if ($("authStatusSide")) {
          $("authStatusSide").value = "구글 승인 실패 또는 취소";
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

  $("submitBtn")?.addEventListener("click", () => {
    if (autoTranslateInFlight) return;
    showSubmitModal(() => { startAutoTranslation(); });
  });

  $("resetBtn")?.addEventListener("click", () => {
    ["videoUrl", "titleInput", "descInput", "autoStatus", "finalOutput", "deliveryLog"].forEach((id) => { if ($(id)) $(id).value = ""; });
    setStatus("제출하기를 누르면 자동번역이 진행됩니다.");
    setAutoBusy(false);
  });

  $("copyFinalBtn")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(($("finalOutput")?.value || "").trim());
      alert("번역결과가 복사되었습니다.");
    } catch (e) {
      alert("번역결과 복사에 실패했습니다.");
    }
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
      if ($("authStatus")) $("authStatus").value = `구글 승인 완료\n채널 연결 확인됨\n채널명: ${item.snippet.title}\n채널 ID: ${item.id}`;
    } catch (e) {
      if ($("authStatus")) $("authStatus").value = `채널 연결 확인 실패\n${e.message}`;
    }
  });

  $("sendOrderBtn")?.addEventListener("click", async () => {
    if (IS_TRIAL_MODE && IS_MOCK_MODE) {
      $("deliveryLog").value = "";
      log("모의 유튜브 채널 등록 시작");
      log(`입력 언어: ${ACTIVE_TOTAL_COUNT}개`);
      setTimeout(() => { log("모의 등록 완료"); location.href = `${ROOT_PREFIX}trial_mock_result.html`; }, 650);
      return;
    }
    await sendLocalizations();
  });
});
