
const COUNTRY_GUIDE = [
  "en | United States", "es | Spain", "fr | France", "de | Germany", "pt | Portugal",
  "it | Italy", "ja | Japan", "ko | South Korea", "zh-CN | China (Simplified)", "zh-TW | Taiwan (Traditional)"
].join("\n");
const TEST_LANGUAGE_CODES = ["en","es","fr","de","pt","it","ja","ko","zh-CN","zh-TW"];
const YT_SCOPE = "https://www.googleapis.com/auth/youtube";
const DEFAULT_VIDEO_LANGUAGE = "en";

const CMD2 = "좋아, 이번에는 타언어 혼입, 문맥의 부자연스러움, 기타 문제를 3차례 자동으로 꼼꼼이 검수해 줘.";
const CMD3 = "좋아, 이번에는 Number: Number 뒤의 숫자, Country Name: 만 삭제해줘.\n중요: 나머지 형식은 지금처럼 그대로 유지할 것(Country Code:, Title:, Description:)";
const CMD4 = "마지막으로 타언어 혼입, 문맥의 부자연스러움, 기타 문제를 한 번 더 검수해 줘. \n형식은 그대로 유지해 줘.";
const CMD10 = "작업이 끝났으면 채팅란의 우측 화살표를 활성화해 줘.";

const PROMPT_TEMPLATE = `제미나이 의뢰문

안녕 제미나이!
아래 제목과 설명문을 시험용 10개 국가 세트에 맞춰 자연스럽게 현지화 번역해 줘.
원문 제목과 설명문의 형식에 따라, 1단계 먼저 전체 번역 부탁해. 중간에 끊으면 안되네.

[원문]
Title: {title}

Description:
{desc}

[출력 형식]
1. 1단계
Nmber: 순번
Country Code: 언어코드
Country Name: 영어 국가명
Title: 번역된 제목
Description:
번역된 설명문

2. 2단계(최후 도출문 샘플 - 영어)
Country Code: en
Title: {title}
Description:
{desc}

[핵심 원칙]
1. 처음부터 끝까지 절대 끊지 말고 계속 번역해 줘.
2. 아래 대응표의 Country Code와 Country Name을 그대로 사용할 것
3. 블록 순서는 절대 바꾸지 말 것
4. 각 블록은 반드시 Country Code로 시작할 것
5. Description의 문단 구조와 줄바꿈은 원문 흐름을 유지할 것
6. 번역은 현지 독자가 자연스럽게 느끼도록 부드럽게 현지화할 것
7. 제목, 설명문 외의 군소리, 안내문, 해설문, 키워드 줄, 해시태그, 코드블록, HTML은 넣지 말 것
8. 다음 언어 블록이 나오기 전까지의 모든 줄은 같은 언어의 Description으로 본다
9. [전체 복사하기]를 넣지 말아 줘.
10. 작업이 끝났으면 채팅란의 우측 화살표를 활성화해 줘.

[Country Code / Country Name 대응표]
{countryGuide}

[반드시 사용할 언어코드 및 순서]
${TEST_LANGUAGE_CODES.map(c => `"${c}"`).join(", ")}
`;

const $ = (id) => document.getElementById(id);
let copied = false;
let tokenClient = null;
let accessToken = null;

function log(msg) {
  const box = $("deliveryLog");
  const now = new Date().toLocaleTimeString("ko-KR");
  box.value += `[${now}] ${msg}\n`;
  box.scrollTop = box.scrollHeight;
}

function buildPrompt() {
  const title = ($("titleInput").value || "").trim();
  const desc = ($("descInput").value || "").trim();
  return PROMPT_TEMPLATE
    .replaceAll("{title}", title || "[제목을 입력해 주세요]")
    .replaceAll("{desc}", desc || "[설명문을 입력해 주세요]")
    .replaceAll("{countryGuide}", COUNTRY_GUIDE);
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
    if (cc) {
      if (cur) items.push(cur);
      cur = { code: cc[1].trim(), title: "", description: "" };
      mode = null;
      continue;
    }

    if (!cur) continue;

    const title = line.match(/^Title:\s*(.*)$/i);
    if (title) {
      cur.title = title[1].trim();
      mode = null;
      continue;
    }

    const desc = line.match(/^Description:\s*$/i);
    if (desc) {
      mode = "description";
      continue;
    }

    if (/^Country Name:\s*/i.test(line) || /^Nmber:\s*/i.test(line) || /^Number:\s*/i.test(line)) {
      continue;
    }

    if (mode === "description") {
      cur.description += (cur.description ? "\n" : "") + line;
    }
  }

  if (cur) items.push(cur);
  return items.filter(x => x.code && x.title);
}

function buildLocalizationMap(items, limitCount, defaultLanguage = DEFAULT_VIDEO_LANGUAGE) {
  const map = {};
  const filtered = items.filter(item => {
    const code = (item.code || "").trim();
    return code && code.toLowerCase() !== defaultLanguage.toLowerCase();
  });

  const sliced = filtered.slice(0, limitCount);

  for (const item of sliced) {
    map[item.code] = {
      title: item.title || "",
      description: item.description || ""
    };
  }
  return map;
}

function initTokenClient() {
  const clientId = ($("clientIdInput").value || "").trim();
  if (!clientId) {
    alert("OAuth 클라이언트 ID를 먼저 입력해 주세요.");
    return false;
  }

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
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,localizations&id=${encodeURIComponent(videoId)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "videos.list 실패");

  const item = data.items && data.items[0];
  if (!item) throw new Error("대상 영상을 찾지 못했습니다.");
  return item;
}

async function updateVideoLocalizations(videoId, existingVideo, mergedLocalizations) {
  const existingSnippet = existingVideo.snippet || {};
  const defaultLanguage = existingSnippet.defaultLanguage || DEFAULT_VIDEO_LANGUAGE;

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
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "videos.update 실패");
  return data;
}

async function sendLocalizations(limitCount) {
  $("deliveryLog").value = "";

  if (!accessToken) {
    alert("먼저 구글 승인을 진행해 주세요.");
    return;
  }

  const videoUrl = ($("videoUrl").value || "").trim();
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    alert("유튜브 영상 주소에서 videoId를 찾지 못했습니다.");
    return;
  }

  const finalText = ($("finalOutput").value || "").trim();
  const items = parseFinalText(finalText);
  if (!items.length) {
    alert("제미나이 최종본을 붙여넣어 주세요.");
    return;
  }

  log(`대상 videoId: ${videoId}`);
  log(`최종본에서 파싱한 언어 수: ${items.length}`);

  try {
    const existing = await fetchVideo(videoId);
    const existingDefaultLanguage = existing.snippet?.defaultLanguage || DEFAULT_VIDEO_LANGUAGE;

    log(`기존 defaultLanguage: ${existingDefaultLanguage}`);
    log(`기존 localizations 수: ${Object.keys(existing.localizations || {}).length}`);

    const newMap = buildLocalizationMap(items, limitCount, existingDefaultLanguage);
    if (!Object.keys(newMap).length) {
      throw new Error("전송할 번역 언어가 없습니다. 기본언어와 중복되는 코드만 있는지 확인해 주세요.");
    }

    const mergedLocalizations = Object.assign({}, existing.localizations || {}, newMap);

    log(`이번 전송 대상 번역 언어 수: ${Object.keys(newMap).length}`);
    log(`이번 전송 언어 코드: ${Object.keys(newMap).join(", ")}`);

    await updateVideoLocalizations(videoId, existing, mergedLocalizations);

    log("videos.update 전송 완료");

    const verify = await fetchVideo(videoId);
    log(`사후확인 defaultLanguage: ${verify.snippet?.defaultLanguage || "(없음)"}`);
    log(`사후확인 localizations 수: ${Object.keys(verify.localizations || {}).length}`);
    log("실등록 성공");
  } catch (e) {
    log(`실등록 실패: ${e.message}`);
    alert(`실등록 실패: ${e.message}`);
  }
}

$("cmd2").value = CMD2;
$("cmd3").value = CMD3;
$("cmd4").value = CMD4;
$("cmd10").value = CMD10;

$("submitBtn").addEventListener("click", () => {
  $("promptOutput").value = buildPrompt();
  $("copyPromptBtn").classList.remove("hidden");
  $("copyPromptBtn").classList.add("blink");
  $("copyWarning").classList.remove("hidden");
  $("choiceArea").classList.remove("hidden");
  $("commandBlock").classList.remove("hidden");
  $("copyWarning").textContent = "※ ‘복사 버튼’을 누르셔야 다음 진행이 가능합니다.";
  copied = false;
});

$("copyPromptBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("promptOutput").value);
    $("copyPromptBtn").textContent = "복사 완료";
    $("copyPromptBtn").classList.remove("blink");
    $("copyWarning").textContent = "복사가 완료되었습니다. 아래에서 번역 방식을 선택해 주세요.";
    copied = true;
    setTimeout(() => { $("copyPromptBtn").textContent = "복사 버튼"; }, 1500);
  } catch {
    alert("복사에 실패했습니다. 직접 선택 후 복사해 주세요.");
  }
});

document.querySelectorAll(".mini-copy").forEach(btn => {
  btn.addEventListener("click", async () => {
    const id = btn.dataset.copy;
    const target = $(id);
    try {
      await navigator.clipboard.writeText(target.value);
      const old = btn.textContent;
      btn.textContent = "복사 완료";
      setTimeout(() => { btn.textContent = old; }, 1200);
    } catch {
      alert("명령어 복사에 실패했습니다.");
    }
  });
});

function guardCopied() {
  if (!copied) {
    alert("먼저 복사 버튼을 눌러 주세요.");
    return false;
  }
  return true;
}

$("manualBtn").addEventListener("click", () => {
  if (!guardCopied()) return;
  window.open("https://gemini.google.com/", "_blank", "noopener,noreferrer");
  alert("Gemini 새 탭을 열었습니다. 복사한 의뢰문과 아래 명령어를 순서대로 붙여넣어 주세요.");
});

$("fastBtn").addEventListener("click", () => {
  if (!guardCopied()) return;
  alert("다음 단계에서 OpenAI API 기반 '자동으로 고속번역하기'를 연결할 예정입니다.");
});

$("copyFinalBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(($("finalOutput").value || "").trim());
    alert("최종본이 복사되었습니다.");
  } catch {
    alert("최종본 복사에 실패했습니다.");
  }
});

$("authBtn").addEventListener("click", () => {
  if (!initTokenClient()) return;
  tokenClient.requestAccessToken({ prompt: "consent" });
});

$("channelBtn").addEventListener("click", async () => {
  if (!accessToken) {
    alert("먼저 구글 승인을 진행해 주세요.");
    return;
  }

  try {
    const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await res.json();
    const item = data.items && data.items[0];

    if (!item) throw new Error("채널 정보를 찾지 못했습니다.");

    $("authStatus").value =
      `구글 승인 완료\n채널 연결 확인됨\n채널명: ${item.snippet.title}\n채널 ID: ${item.id}`;
  } catch (e) {
    $("authStatus").value = `채널 연결 확인 실패\n${e.message}`;
  }
});

$("send1Btn").addEventListener("click", async () => {
  await sendLocalizations(1);
});

$("send10Btn").addEventListener("click", async () => {
  await sendLocalizations(10);
});
