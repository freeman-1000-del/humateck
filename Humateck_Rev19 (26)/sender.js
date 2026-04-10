// sender.js — 성공본 기반

const YT_SCOPE = "https://www.googleapis.com/auth/youtube";
const DEFAULT_VIDEO_LANGUAGE = "en";
let accessToken = null;
const $ = id => document.getElementById(id);

function log(msg) {
  const box = $("deliveryLog");
  if (!box) return;
  box.value += "[" + new Date().toLocaleTimeString("ko-KR") + "] " + msg + "\n";
  box.scrollTop = box.scrollHeight;
}

function setProgress(pct, text) {
  if ($("progressBar"))     $("progressBar").style.width = pct + "%";
  if ($("progressPercent")) $("progressPercent").textContent = pct + "%";
  if ($("progressText"))    $("progressText").textContent = text || "";
}

function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const p = u.pathname.split("/");
    const idx = p.indexOf("shorts");
    if (idx >= 0 && p[idx+1]) return p[idx+1];
  } catch(e) {}
  return null;
}

function parseFinalText(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const items = [];
  let cur = null, mode = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const cc = line.match(/^Country Code:\s*(.+)$/i);
    if (cc) {
      if (cur) items.push(cur);
      cur = { code: cc[1].trim(), title: "", description: "" };
      mode = null; continue;
    }
    if (!cur) continue;
    const ti = line.match(/^Title:\s*(.*)$/i);
    if (ti) { cur.title = ti[1].trim(); mode = null; continue; }
    if (/^Description:\s*$/i.test(line)) { mode = "desc"; continue; }
    if (/^(Country Name|Number|Nmber):\s*/i.test(line)) continue;
    if (mode === "desc") cur.description += (cur.description ? "\n" : "") + line;
  }
  if (cur) items.push(cur);
  return items.filter(x => x.code && x.title);
}

function buildLocalizationMap(items, defaultLanguage) {
  const map = {};
  items.forEach(item => {
    if (item.code && item.code.toLowerCase() !== (defaultLanguage || "en").toLowerCase()) {
      map[item.code] = { title: item.title || "", description: item.description || "" };
    }
  });
  return map;
}

async function fetchVideo(videoId) {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/videos?part=snippet,localizations&id=" + encodeURIComponent(videoId),
    { headers: { Authorization: "Bearer " + accessToken } }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "videos.list 실패");
  const item = data.items?.[0];
  if (!item) throw new Error("대상 영상을 찾지 못했습니다.");
  return item;
}

async function updateVideoLocalizations(videoId, existingVideo, mergedLocalizations) {
  const snippet = existingVideo.snippet || {};
  const defaultLanguage = snippet.defaultLanguage || DEFAULT_VIDEO_LANGUAGE;

  if (!snippet.title)      throw new Error("기존 영상의 snippet.title을 찾지 못했습니다.");
  if (!snippet.categoryId) throw new Error("기존 영상의 snippet.categoryId를 찾지 못했습니다.");

  const body = {
    id: videoId,
    snippet: {
      title: snippet.title,
      categoryId: snippet.categoryId,
      defaultLanguage: defaultLanguage
    },
    localizations: mergedLocalizations
  };

  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/videos?part=snippet,localizations",
    {
      method: "PUT",
      headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "videos.update 실패");
  return data;
}

async function sendLocalizations() {
  $("deliveryLog").value = "";

  if (!accessToken) { alert("먼저 구글 승인을 받아주세요."); return; }

  const videoId = extractVideoId(($("videoUrl")?.value || "").trim());
  if (!videoId) { alert("유튜브 영상 주소를 확인해 주세요."); return; }

  const items = parseFinalText(($("finalOutput")?.value || "").trim());
  if (!items.length) { alert("제미나이 최종본을 붙여넣어 주세요."); return; }

  log("대상 videoId: " + videoId);
  log("파싱된 언어 수: " + items.length);
  setProgress(10, "조회 중...");

  const start = Date.now();
  const timer = setInterval(() => {
    if ($("elapsedTime")) $("elapsedTime").textContent = "등록소요시간: " + Math.floor((Date.now()-start)/1000) + "초";
  }, 500);

  try {
    const existing = await fetchVideo(videoId);
    log("기존 localizations 수: " + Object.keys(existing.localizations || {}).length);
    setProgress(30, "전송 준비...");

    const newMap = buildLocalizationMap(items, existing.snippet?.defaultLanguage);
    const merged = Object.assign({}, existing.localizations || {}, newMap);
    log("전송 언어 수: " + Object.keys(newMap).length);
    setProgress(55, "전송 중...");

    await updateVideoLocalizations(videoId, existing, merged);
    setProgress(80, "확인 중...");

    const verify = await fetchVideo(videoId);
    const confirmed = Object.keys(verify.localizations || {}).length;
    log("사후확인 localizations 수: " + confirmed);
    log("실등록 성공");
    setProgress(100, confirmed + " / " + confirmed);

  } catch(e) {
    log("실등록 실패: " + e.message);
    alert("실등록 실패: " + e.message);
    setProgress(0, "");
  } finally {
    clearInterval(timer);
    if ($("elapsedTime")) $("elapsedTime").textContent = "등록소요시간: " + Math.floor((Date.now()-start)/1000) + "초";
  }
}

document.addEventListener("DOMContentLoaded", () => {

  $("oauthStartBtnSide")?.addEventListener("click", () => {
    const clientId = ($("clientIdSideInput")?.value || "").trim();
    if (!clientId) { alert("OAuth 클라이언트 ID를 입력해 주세요."); return; }
    google.accounts.oauth2.initTokenClient({
      client_id: clientId, scope: YT_SCOPE,
      callback: (resp) => {
        accessToken = resp?.access_token || null;
        const msg = accessToken ? "구글 승인 완료\nAccess Token 수신 완료" : "구글 승인 실패";
        if ($("authStatusSide")) $("authStatusSide").value = msg;
        if ($("authStatus"))     $("authStatus").value = msg;
      }
    }).requestAccessToken({ prompt: "consent" });
  });

  $("oauthStartBtn")?.addEventListener("click", () => {
    const clientId = ($("clientIdInput")?.value || $("clientIdSideInput")?.value || "").trim();
    if (!clientId) { alert("OAuth 클라이언트 ID를 입력해 주세요."); return; }
    google.accounts.oauth2.initTokenClient({
      client_id: clientId, scope: YT_SCOPE,
      callback: (resp) => {
        accessToken = resp?.access_token || null;
        const msg = accessToken ? "구글 승인 완료\nAccess Token 수신 완료" : "구글 승인 실패";
        if ($("authStatus"))     $("authStatus").value = msg;
        if ($("authStatusSide")) $("authStatusSide").value = msg;
      }
    }).requestAccessToken({ prompt: "consent" });
  });

  async function checkChannel() {
    if (!accessToken) { alert("먼저 구글 승인을 받아주세요."); return; }
    try {
      const res  = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { Authorization: "Bearer " + accessToken } });
      const data = await res.json();
      const item = data.items?.[0];
      if (!item) throw new Error("채널 정보를 찾지 못했습니다.");
      const msg = "구글 승인 완료\n채널명: " + item.snippet.title + "\n채널 ID: " + item.id;
      if ($("authStatusSide")) $("authStatusSide").value = msg;
      if ($("authStatus"))     $("authStatus").value = msg;
    } catch(e) {
      const msg = "채널 연결 확인 실패\n" + e.message;
      if ($("authStatusSide")) $("authStatusSide").value = msg;
      if ($("authStatus"))     $("authStatus").value = msg;
    }
  }

  $("channelCheckBtnSide")?.addEventListener("click", checkChannel);
  $("channelCheckBtn")?.addEventListener("click",     checkChannel);

  $("openOauthGuideBtn")?.addEventListener("click",  () => $("oauthGuideModal")?.classList.remove("hidden"));
  $("closeOauthGuideBtn")?.addEventListener("click", () => $("oauthGuideModal")?.classList.add("hidden"));
  $("oauthGuideBackdrop")?.addEventListener("click", () => $("oauthGuideModal")?.classList.add("hidden"));

  $("sendOrderBtn")?.addEventListener("click", async () => {
    await sendLocalizations();
  });
});
