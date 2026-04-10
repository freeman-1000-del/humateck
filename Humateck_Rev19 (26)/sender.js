// sender.js v2 — 대수술판

const YT_SCOPE = "https://www.googleapis.com/auth/youtube";
let accessToken = null;
const $ = id => document.getElementById(id);

// ── 줄바꿈 정규화 후 파싱 ──
function parseToLocalizationMap(raw) {
  // 모든 줄바꿈 통일
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n");
  const map = {};
  let code = null, title = "", desc = "", descMode = false;

  function flush() {
    if (code) map[code] = { title: title.trim(), description: desc.trim() };
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();

    // Country Code 발견 → 이전 블록 저장 후 새 블록 시작
    const ccMatch = line.match(/^Country Code:\s*(.+)$/i);
    if (ccMatch) {
      flush();
      code = ccMatch[1].trim();
      title = ""; desc = ""; descMode = false;
      continue;
    }

    if (!code) continue;

    // Title
    const tiMatch = line.match(/^Title:\s*(.*)$/i);
    if (tiMatch) { title = tiMatch[1].trim(); descMode = false; continue; }

    // Description 시작
    if (/^Description:\s*$/i.test(line)) { descMode = true; continue; }

    // 무시할 줄
    if (/^(Country Name|Number|Nmber):\s*/i.test(line)) continue;

    // Description 내용 수집
    if (descMode) desc += (desc ? "\n" : "") + line;
  }
  flush();
  return map;
}

function log(msg) {
  const box = $("deliveryLog");
  if (!box) return;
  box.value += "[" + new Date().toLocaleTimeString("ko-KR") + "] " + msg + "\n";
  box.scrollTop = box.scrollHeight;
}

function setProgress(pct, text) {
  if ($("progressBar"))     $("progressBar").style.width = pct + "%";
  if ($("progressPercent")) $("progressPercent").textContent = pct + "%";
  if ($("progressText"))    $("progressText").textContent = text;
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

document.addEventListener("DOMContentLoaded", () => {

  // ── OAuth 우측패널 ──
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

  // ── 채널 확인 ──
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
      if ($("authStatusSide")) $("authStatusSide").value = "채널 연결 확인 실패\n" + e.message;
      if ($("authStatus"))     $("authStatus").value = "채널 연결 확인 실패\n" + e.message;
    }
  }
  $("channelCheckBtnSide")?.addEventListener("click", checkChannel);
  $("channelCheckBtn")?.addEventListener("click",     checkChannel);

  // ── 모달 ──
  $("openOauthGuideBtn")?.addEventListener("click",  () => $("oauthGuideModal")?.classList.remove("hidden"));
  $("closeOauthGuideBtn")?.addEventListener("click", () => $("oauthGuideModal")?.classList.add("hidden"));
  $("oauthGuideBackdrop")?.addEventListener("click", () => $("oauthGuideModal")?.classList.add("hidden"));

  // ── YouTube 자막 등록 ──
  $("sendOrderBtn")?.addEventListener("click", async () => {
    if (!accessToken) { alert("먼저 구글 승인을 받아주세요."); return; }

    const videoId = extractVideoId(($("videoUrl")?.value || "").trim());
    if (!videoId) { alert("유튜브 영상 주소를 확인해 주세요."); return; }

    const rawText = ($("finalOutput")?.value || "");
    const locMap  = parseToLocalizationMap(rawText);
    const count   = Object.keys(locMap).length;

    if (count === 0) {
      alert("번역 데이터를 읽지 못했습니다.\n제미나이 최종본을 다시 붙여넣어 주세요.");
      return;
    }

    $("deliveryLog").value = "";
    log("발송 시작 — " + count + "개 언어");
    log("대상 videoId: " + videoId);
    setProgress(30, "전송 중...");

    const start = Date.now();
    const timer = setInterval(() => {
      if ($("elapsedTime")) $("elapsedTime").textContent = "등록소요시간: " + Math.floor((Date.now()-start)/1000) + "초";
    }, 500);

    try {
      const res = await fetch("https://www.googleapis.com/youtube/v3/videos?part=localizations", {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: videoId, localizations: locMap })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || "전송 실패 (HTTP " + res.status + ")");
      }

      const confirmed = Object.keys(data.localizations || {}).length;
      log("등록 성공 — YouTube 확인 " + confirmed + "개");
      setProgress(100, confirmed + " / " + confirmed);

    } catch(e) {
      log("등록 실패: " + e.message);
      alert("등록 실패: " + e.message);
      setProgress(0, "0 / " + count);
    } finally {
      clearInterval(timer);
      const sec = Math.floor((Date.now()-start)/1000);
      if ($("elapsedTime")) $("elapsedTime").textContent = "등록소요시간: " + sec + "초";
    }
  });
});
