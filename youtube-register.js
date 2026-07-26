/*
[Humateck Developer Warning]
This file is the ONLY YouTube registration delivery line.
Allowed: use the Google OAuth result and deliver the customer-approved text to YouTube API.
Forbidden: review, block, judge, pre-validate, modify, auto-correct, add metadata logic, add hidden/admin/test menus, or create self-made registration errors.
Humateck is a delivery system. Google handles authentication. YouTube handles registration response.
Do not move this logic back into order.html.

Failover principle:
- Primary delivery path: localizations-only update.
- Backup delivery path: snippet + localizations update using the existing YouTube snippet.
- The backup path is not a reviewer. It only retries the same customer-approved delivery with a safer YouTube request shape.
*/
(function(){
  "use strict";

  function $(id){ return document.getElementById(id); }

  /* Same order as plan-scope-preview GLOBAL70 (promised Global plans) */
  var COUNTRY_ORDER_70 = [
    "en","hi","pt","id","es-419","ja","ru","de","tr","ko",
    "fr","vi","th","fil","ar","it","ms","zh-TW","uk","pl",
    "nl","es","sv","ro","cs","hu","el","zh-HK","ur","bn",
    "pt-PT","fa","iw","sw","am","af","ta","te","mr","my",
    "km","ne","lo","gu","kn","ml","pa","no","da","fi",
    "sk","bg","hr","sr","lt","lv","et","az","ka","be",
    "bs","mk","sq","fr-CA","es-US","sr-Latn","ca","eu","gl","zh-CN"
  ];

  function showResult(message){
    var box = $("deliveryLog");
    if(box){
      box.value = message;
      box.scrollTop = box.scrollHeight;
      try{
        box.scrollIntoView({ behavior: "smooth", block: "center" });
      }catch(e){
        box.scrollIntoView(true);
      }
    }
  }

  function isKoreanUi(){
    var lang = String((document.documentElement && document.documentElement.lang) || "").toLowerCase();
    return lang.indexOf("ko") === 0;
  }

  function uiCopy(){
    if(isKoreanUi()){
      return {
        sequential: "순차등록",
        simultaneous: "동시등록",
        busy: "등록 중…",
        paceNote:
          "유튜브 알고리즘에 의해 동시다발 공격 컨텐츠로 오인되는 위험을 막기 위해 국가별로 30초 순차등록을 적용합니다. 수초 동시등록을 원하시는 경우 '동시등록' 버튼을 눌러 주세요.",
        simStart: function(n){ return "동시등록을 시작합니다.\n대상: " + n + "개 언어 · 일괄 반영"; },
        simDone: function(n, sec, codeList){
          return "등록 결과\n대상 언어 수: " + n + "개\n방식: 동시등록\n소요 시간: " + sec + "초\n등록 성공 국가코드:\n" + codeList;
        },
        seqStart: function(n){ return "순차등록을 시작합니다.\n대상: " + n + "개 언어 · 30초 순차등록"; },
        seqProgress: function(i, total, code, count){
          return "순차등록 " + i + "/" + total + " · " + code + "\n누적 반영 언어: " + count;
        },
        seqWait: function(code, i, total){ return "완료: " + code + " (" + i + "/" + total + ")"; },
        seqDone: function(n, min, sec, codeList){
          return "등록 결과\n대상 언어 수: " + n + "개\n방식: 30초 순차등록\n소요 시간: 약 " + min + "분 (" + sec + "초)\n등록 성공 국가코드:\n" + codeList;
        },
        nextIn: "다음 국가까지 "
      };
    }
    return {
      sequential: "Sequential Registration",
      simultaneous: "Simultaneous Registration",
      busy: "Registration in Progress",
      paceNote:
        "To reduce the risk of YouTube's algorithm mistaking bulk uploads for simultaneous attack content, we apply 30-second sequential registration per country. If you want registration within seconds, press the Simultaneous Registration button.",
      simStart: function(n){ return "Starting simultaneous registration.\nTargets: " + n + " languages · bulk apply"; },
      simDone: function(n, sec, codeList){
        return "Registration Results\nNumber of target languages: " + n + "\nMode: simultaneous registration\nRegistration time: " + sec + " seconds\nRegistered country codes:\n" + codeList;
      },
      seqStart: function(n){ return "Starting sequential registration.\nTargets: " + n + " languages · 30-second sequential registration"; },
      seqProgress: function(i, total, code, count){
        return "Sequential registration " + i + "/" + total + " · " + code + "\nLanguages applied so far: " + count;
      },
      seqWait: function(code, i, total){ return "Done: " + code + " (" + i + "/" + total + ")"; },
      seqDone: function(n, min, sec, codeList){
        return "Registration Results\nNumber of target languages: " + n + "\nMode: 30-second sequential registration\nRegistration time: about " + min + " minutes (" + sec + " seconds)\nRegistered country codes:\n" + codeList;
      },
      nextIn: "Next country in "
    };
  }

  function formatRegisteredCodeList(codes){
    var list = (codes || []).slice();
    var scope = window.HumateckPlanScope;
    if(scope && typeof scope.getCodes === "function"){
      var planCodes = scope.getCodes(scope.resolvePlanId());
      if(planCodes && planCodes.length){
        var ok = {};
        list.forEach(function(c){ ok[c] = true; });
        var ordered = planCodes.filter(function(c){ return ok[c]; });
        var extras = list.filter(function(c){ return planCodes.indexOf(c) < 0; });
        list = ordered.concat(extras);
      }
    }
    return list.join(", ");
  }

  function noteRegisteredCountries(codes){
    if(window.HumateckPlanScope && typeof window.HumateckPlanScope.refreshSelectedCountriesPanel === "function"){
      window.HumateckPlanScope.refreshSelectedCountriesPanel(codes || []);
    }
  }

  function registerButtons(){
    return [
      $("sendOrderBtnSequential"),
      $("sendOrderBtnSimultaneous"),
      $("sendOrderBtn"),
      $("youtubeRegisterBtn")
    ].filter(Boolean);
  }

  function setButtonBusy(isBusy){
    var copy = uiCopy();
    registerButtons().forEach(function(btn){
      btn.disabled = !!isBusy;
      if(btn.id === "sendOrderBtnSimultaneous"){
        btn.textContent = isBusy ? copy.busy : copy.simultaneous;
      }else{
        btn.textContent = isBusy ? copy.busy : copy.sequential;
      }
    });
  }

  function getValue(ids){
    for(var i=0;i<ids.length;i++){
      var el = $(ids[i]);
      if(el && typeof el.value === "string" && el.value.trim()) return el.value.trim();
    }
    return "";
  }

  function getAccessToken(){
    // Only the in-memory token from a live OAuth callback on this page
    if(window.humateckGoogleAccessToken) return window.humateckGoogleAccessToken;
    return getValue(["googleAccessToken","accessToken","oauthAccessToken","authToken"]);
  }

  function getVideoUrl(){ return getValue(["videoUrl", "sourceVideoUrl", "youtubeUrl"]); }
  function getFinalText(){ return getValue(["finalOutput", "finalText", "finalResultText"]); }
  function getNativeLanguageCode(){ return getValue(["nativeLanguageCode"]) || "en"; }
  function getNativeTitle(){ return getValue(["sourceTitle"]); }
  function getNativeDescription(){ return getValue(["sourceDescription"]); }

  function isVideoId(value){
    return /^[a-zA-Z0-9_-]{11}$/.test(String(value || ""));
  }

  function extractVideoId(value){
    var raw = String(value || "").trim();
    if(!raw) return "";
    // Paste may include extra words/lines — use the first URL-looking token when possible.
    var token = raw.split(/\s+/).filter(Boolean)[0] || raw;
    if(isVideoId(token)) return token;
    if(token.indexOf("http") !== 0 && /(youtu\.be|youtube\.com)/i.test(token)){
      token = "https://" + token.replace(/^\/+/, "");
    }
    try{
      var u = new URL(token);
      var host = String(u.hostname || "").replace(/^www\./i, "").toLowerCase();
      if(host === "youtu.be"){
        var shortId = u.pathname.replace(/^\//, "").split("/")[0];
        if(isVideoId(shortId)) return shortId;
      }
      if(host.indexOf("youtube.com") >= 0 || host.indexOf("youtube-nocookie.com") >= 0){
        var v = u.searchParams.get("v");
        if(isVideoId(v)) return v;
        var parts = u.pathname.split("/").filter(Boolean);
        for(var i = 0; i < parts.length; i++){
          if((parts[i] === "shorts" || parts[i] === "live" || parts[i] === "embed" || parts[i] === "v") && parts[i + 1]){
            var cand = String(parts[i + 1]).replace(/[^a-zA-Z0-9_-].*$/, "");
            if(isVideoId(cand)) return cand;
          }
        }
      }
    }catch(e){}
    var matched = raw.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([a-zA-Z0-9_-]{11})/);
    if(matched && isVideoId(matched[1])) return matched[1];
    return isVideoId(token) ? token : "";
  }

  function clean(v){ return String(v || "").replace(/^\s+|\s+$/g, ""); }
  function stripNumberAndCountryName(text){
    return String(text || "")
      .replace(/^\s*Number\s*:\s*.*$/gmi, "")
      .replace(/^\s*Country\s*Name\s*:\s*.*$/gmi, "");
  }

  /* 🛠️ [수정 완료] 맨 첫 줄에 나오는 첫 번째 국가 코드도 누락 없이 완벽히 세도록 로직 보완 */
  function parseLabeledCountryCode(finalText){
    var text = stripNumberAndCountryName(String(finalText || "").replace(/\r/g, "")).trim();
    
    // 줄바꿈 기호(\n) 의존성을 없애고 'Country Code :' 단어 자체로 안전하게 분할합니다.
    var parts = text.split(/\s*Country\s*Code\s*:\s*/i);
    var localizations = {};

    for(var i=1; i<parts.length; i++){
      var block = parts[i];
      var lines = block.split("\n");
      var code = clean(lines.shift() || "");
      if(!code) continue;
      var parsed = parseTitleDescription(lines.join("\n"));
      localizations[code] = parsed;
    }
    return localizations;
  }

  function parseCodeLineBlocks(finalText){
    var text = stripNumberAndCountryName(String(finalText || "").replace(/\r/g, ""));
    var localizations = {};
    var codes = COUNTRY_ORDER_70.slice();

    for(var i=0;i<codes.length;i++){
      var code = codes[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var nextCodes = codes.slice(i+1).map(function(c){ return c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|");
      var end = nextCodes ? "(?=\\n\\s*(?:" + nextCodes + ")\\s*\\n|$)" : "(?=$)";
      var re = new RegExp("(?:^|\\n)\\s*(" + code + ")\\s*\\n([\\s\\S]*?)" + end, "i");
      var m = text.match(re);
      if(m){
        localizations[codes[i]] = parseTitleDescription(m[2]);
      }
    }
    return localizations;
  }

  function parseSequentialTitleDescription(finalText){
    var text = stripNumberAndCountryName(String(finalText || "").replace(/\r/g, ""));
    var localizations = {};
    var pattern = /(?:^|\n)\s*Title\s*:\s*([^\n]*)([\s\S]*?)(?=\n\s*Title\s*:|$)/gi;
    var match;
    var index = 0;
    while((match = pattern.exec(text)) && index < COUNTRY_ORDER_70.length){
      var title = clean(match[1]);
      var body = match[2] || "";
      var description = "";
      var d = body.search(/\n\s*Description\s*:/i);
      if(d >= 0){
        description = body.slice(d).replace(/^\n\s*Description\s*:\s*/i, "").replace(/\n+$/g, "");
      }else{
        description = body.replace(/^\n+/, "").replace(/\n+$/g, "");
      }
      localizations[COUNTRY_ORDER_70[index]] = { title: title, description: description };
      index++;
    }
    return localizations;
  }

  function parseTitleDescription(text){
    var source = String(text || "");
    var title = "";
    var description = "";
    var titleMatch = source.match(/(?:^|\n)\s*Title\s*:\s*([^\n]*)/i);
    if(titleMatch) title = clean(titleMatch[1]);
    var descMatch = source.match(/(?:^|\n)\s*Description\s*:\s*([\s\S]*)/i);
    if(descMatch) description = String(descMatch[1] || "").replace(/^\n+/, "").replace(/\n+$/g, "");
    return { title: title, description: description };
  }

  function normalizeLocalizationItem(item){
    var title = clean((item && item.title) || "");
    var description = clean((item && item.description) || "");
    if(!title && description){
      title = description.split(/\n/)[0].slice(0, 100);
    }
    if(!description && title){
      description = title;
    }
    if(!title && !description) return null;
    return {
      title: title.slice(0, 100),
      description: description.slice(0, 5000)
    };
  }

  function filterUsableLocalizations(map){
    var out = {};
    Object.keys(map || {}).forEach(function(code){
      var normalized = normalizeLocalizationItem(map[code]);
      if(normalized) out[code] = normalized;
    });
    return out;
  }

  /** Plain text / single-word fallback — never fail just because Gemini format is missing */
  function parsePlainTextAsLocalizations(finalText){
    var text = clean(stripNumberAndCountryName(String(finalText || "").replace(/\r/g, "")));
    if(!text) return {};
    var code = getNativeLanguageCode() || "en";
    var out = {};
    out[code] = {
      title: text.split(/\n/)[0].slice(0, 100),
      description: text.slice(0, 5000)
    };
    return out;
  }

  function chooseLocalizations(finalText){
    var first = filterUsableLocalizations(parseLabeledCountryCode(finalText));
    if(Object.keys(first).length) return first;
    var second = filterUsableLocalizations(parseCodeLineBlocks(finalText));
    if(Object.keys(second).length) return second;
    var third = filterUsableLocalizations(parseSequentialTitleDescription(finalText));
    if(Object.keys(third).length) return third;
    return filterUsableLocalizations(parsePlainTextAsLocalizations(finalText));
  }

  function explainYouTubeError(res, data){
    var err = (data && data.error) || {};
    var raw = String(err.message || "").trim() || "Temporary YouTube registration response was not accepted.";
    var reasons = (err.errors || []).map(function(item){ return String((item && item.reason) || ""); }).filter(Boolean);
    var reasonText = reasons.join(", ");
    var lower = (raw + " " + reasonText).toLowerCase();
    var ko = isKoreanUi();

    if(res.status === 401 || /auth|invalid.?credentials|token/i.test(lower)){
      return ko
        ? "YouTube 인증이 만료되었거나 권한이 없습니다.\nOAuth Authorization을 다시 실행한 뒤 재시도해 주세요.\n(원문: " + raw + ")"
        : "YouTube authorization expired or is missing permission.\nRun OAuth Authorization again, then retry.\n(Detail: " + raw + ")";
    }

    if(res.status === 403 || /forbidden/i.test(lower)){
      if(/age.?restrict|content.?owner|forbidden/i.test(lower) || reasons.indexOf("forbidden") >= 0){
        return ko
          ? "Forbidden — YouTube가 등록을 거부했습니다.\n확인 사항:\n1) OAuth에 사용한 Google 계정이 해당 영상 수정 권한이 있는지\n2) 영상이 Age-restricted(연령 제한)이면 'Not age-restricted'로 변경\n3) 영상 URL이 본인 채널 영상인지\n4) OAuth Authorization을 다시 실행\n(원문: " + raw + ")"
          : "Forbidden — YouTube rejected the registration.\nCheck:\n1) The Google account used for OAuth can edit this video\n2) If the video is Age-restricted, set it to Not age-restricted\n3) The video URL belongs to your channel\n4) Run OAuth Authorization again\n(Detail: " + raw + ")";
      }
      return ko
        ? "Forbidden — 권한 부족으로 거부되었습니다.\nOAuth 계정·영상 소유권·연령 제한 설정을 확인한 뒤 다시 시도해 주세요.\n(원문: " + raw + ")"
        : "Forbidden — permission denied.\nCheck OAuth account, video ownership, and age-restriction settings, then retry.\n(Detail: " + raw + ")";
    }

    if(res.status === 404 || /notFound|videoNotFound/i.test(lower)){
      return ko
        ? "영상을 찾을 수 없습니다. URL/ID를 확인해 주세요.\n(원문: " + raw + ")"
        : "Video not found. Check the URL/ID.\n(Detail: " + raw + ")";
    }

    if(/quota/i.test(lower)){
      return ko
        ? "YouTube API 일일 할당량을 초과했습니다. 내일 다시 시도해 주세요.\n(원문: " + raw + ")"
        : "YouTube API daily quota exceeded. Try again tomorrow.\n(Detail: " + raw + ")";
    }

    return raw + (reasonText ? "\nReason: " + reasonText : "");
  }

  async function youtubeJson(url, options){
    var res = await fetch(url, options || {});
    var data = await res.json().catch(function(){ return {}; });
    if(!res.ok){
      throw new Error(explainYouTubeError(res, data));
    }
    return data;
  }

  /** Per-locale sequential gap — avoid bulk localization spam signals */
  var LOCALE_GAP_MS = 30 * 1000;

  function sleep(ms){
    return new Promise(function(resolve){ setTimeout(resolve, ms); });
  }

  function formatRemain(ms){
    var sec = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + "m " + (s < 10 ? "0" : "") + s + "s";
  }

  async function sleepWithProgress(ms, prefix){
    var copy = uiCopy();
    var end = Date.now() + ms;
    while(true){
      var left = end - Date.now();
      if(left <= 0) break;
      showResult(prefix + "\n" + copy.nextIn + formatRemain(left));
      await sleep(Math.min(1000, left));
    }
  }

  function normalizeLang(code){
    return String(code || "").trim();
  }

  /**
   * YouTube rejects many localizations-only updates when defaultLanguage is unset,
   * and Forbidden often returns for age-restricted / wrong-owner videos.
   * Always send snippet + localizations together, keep existing snippet fields,
   * and never put the default language inside localizations.
   */
  async function putLocalizationsAccumulated(token, videoId, accumulated){
    var existing = await youtubeJson(
      "https://www.googleapis.com/youtube/v3/videos?part=snippet,localizations,status&id=" + encodeURIComponent(videoId),
      { headers: { Authorization: "Bearer " + token } }
    );
    var video = existing.items && existing.items[0] ? existing.items[0] : null;
    if(!video){
      throw new Error(
        isKoreanUi()
          ? "Video not found or not readable with this OAuth account.\n영상 ID: " + videoId + "\n\n확인:\n1) YouTube Video URL이 올바른지\n2) OAuth에 로그인한 Google 계정이 그 영상의 채널 소유/수정 계정인지\n3) 비공개 영상이면 소유 계정으로만 읽힙니다\n4) OAuth Authorization을 다시 실행"
          : "Video not found or not readable with this OAuth account.\nVideo ID: " + videoId + "\n\nCheck:\n1) YouTube Video URL is correct\n2) The Google account used for OAuth owns/can edit that video's channel\n3) Private videos are only readable by the owner account\n4) Run OAuth Authorization again"
      );
    }

    var status = video.status || {};
    if(String(status.uploadStatus || "").toLowerCase() === "rejected" || status.rejectionReason){
      throw new Error(
        isKoreanUi()
          ? "Forbidden — 영상이 YouTube에서 거절/제한 상태입니다.\nStudio에서 연령 제한·제한 사유를 해제한 뒤 다시 시도해 주세요."
          : "Forbidden — this video is rejected/restricted on YouTube.\nClear age-restriction or rejection in YouTube Studio, then retry."
      );
    }

    var snippet = video.snippet || {};
    var defaultLang = normalizeLang(getNativeLanguageCode() || snippet.defaultLanguage || "en") || "en";
    var merged = Object.assign({}, video.localizations || {}, accumulated || {});
    var defaultLoc = merged[defaultLang] || null;
    delete merged[defaultLang];

    // Also strip bare language matches like "en" vs "en-US" only for exact key.
    var title = getNativeTitle() || (defaultLoc && defaultLoc.title) || snippet.title || "";
    var description = getNativeDescription() || (defaultLoc && defaultLoc.description) || snippet.description || "";
    if(!title){
      throw new Error(
        isKoreanUi()
          ? "등록할 제목이 비어 있습니다. Native Title 또는 Final Version을 확인해 주세요."
          : "Title is empty. Check Native Title or Final Version."
      );
    }

    var snippetBody = {
      title: title,
      description: description || title,
      categoryId: snippet.categoryId || "22",
      defaultLanguage: defaultLang
    };
    if(Object.prototype.hasOwnProperty.call(snippet, "tags")){
      snippetBody.tags = snippet.tags || [];
    }

    var body = {
      id: videoId,
      snippet: snippetBody,
      localizations: merged
    };

    try{
      await youtubeJson("https://www.googleapis.com/youtube/v3/videos?part=snippet,localizations", {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
    }catch(error){
      var msg = error && error.message ? error.message : String(error || "");
      if(/forbidden/i.test(msg) && !/Age-restricted|연령/i.test(msg)){
        throw new Error(
          isKoreanUi()
            ? msg + "\n\n이전에 해결하셨던 경우와 같습니다.\nYouTube Studio → 해당 영상 → 연령 제한을 '제한 없음(Not age-restricted)'으로 바꾼 뒤,\nOAuth Authorization을 같은 채널 소유 계정으로 다시 실행해 주세요."
            : msg + "\n\nSame as the earlier fix:\nYouTube Studio → this video → set Age restriction to 'Not age-restricted',\nthen run OAuth Authorization again with the channel owner account."
        );
      }
      throw error;
    }
  }

  async function fetchExistingLocalizations(token, videoId){
    try{
      var existing = await youtubeJson(
        "https://www.googleapis.com/youtube/v3/videos?part=localizations&id=" + encodeURIComponent(videoId),
        { headers: { Authorization: "Bearer " + token } }
      );
      var video = existing.items && existing.items[0] ? existing.items[0] : {};
      return Object.assign({}, video.localizations || {});
    }catch(e){
      return {};
    }
  }

  async function deliver(mode){
    var paceMode = mode === "simultaneous" ? "simultaneous" : "sequential";
    var started = Date.now();
    var token = getAccessToken();
    var videoId = extractVideoId(getVideoUrl());
    var finalText = getFinalText();
    var localizations = chooseLocalizations(finalText);
    var codes = Object.keys(localizations);

    if(!token){
      showResult(
        isKoreanUi()
          ? "Google OAuth 인증이 필요합니다.\nClient ID만 입력한 상태로는 등록되지 않습니다.\n위의 'OAuth Authorization' 버튼을 눌러 Google 승인을 완료한 뒤 다시 시도해 주세요."
          : "Google OAuth is required.\nEntering the Client ID alone is not enough.\nClick 'OAuth Authorization' above, finish Google approval, then try again."
      );
      return;
    }
    if(!videoId){
      showResult(
        isKoreanUi()
          ? "YouTube 동영상 URL(또는 11자리 ID)을 인식하지 못했습니다.\n예: https://www.youtube.com/watch?v=xxxxxxxxxxx\n또는 https://youtu.be/xxxxxxxxxxx"
          : "Could not read a YouTube video URL (or 11-character ID).\nExample: https://www.youtube.com/watch?v=xxxxxxxxxxx\nor https://youtu.be/xxxxxxxxxxx"
      );
      return;
    }
    if(!codes.length){
      showResult(
        isKoreanUi()
          ? "Paste Final Version 칸이 비어 있습니다.\n단어 하나라도 입력한 뒤 다시 시도해 주세요."
          : "Paste Final Version is empty.\nEnter at least one word, then try again."
      );
      return;
    }

    setButtonBusy(true);

    var copy = uiCopy();
    try{
      var accumulated = await fetchExistingLocalizations(token, videoId);
      var seconds;
      var minutes;

      if(paceMode === "simultaneous"){
        showResult(copy.simStart(codes.length));
        Object.keys(localizations).forEach(function(code){
          accumulated[code] = localizations[code];
        });
        await putLocalizationsAccumulated(token, videoId, accumulated);
        seconds = Math.max(1, Math.round((Date.now() - started) / 1000));
        showResult(copy.simDone(codes.length, seconds, formatRegisteredCodeList(codes)));
        noteRegisteredCountries(codes);
        return;
      }

      showResult(copy.seqStart(codes.length));
      for(var i = 0; i < codes.length; i++){
        var code = codes[i];
        accumulated[code] = localizations[code];
        showResult(
          copy.seqProgress(i + 1, codes.length, code, Object.keys(accumulated).length)
        );
        await putLocalizationsAccumulated(token, videoId, accumulated);
        if(i < codes.length - 1){
          await sleepWithProgress(
            LOCALE_GAP_MS,
            copy.seqWait(code, i + 1, codes.length)
          );
        }
      }
      seconds = Math.max(1, Math.round((Date.now() - started) / 1000));
      minutes = Math.round(seconds / 60);
      showResult(copy.seqDone(codes.length, minutes, seconds, formatRegisteredCodeList(codes)));
      noteRegisteredCountries(codes);
    }catch(error){
      var message = error && error.message ? error.message : String(error || "Temporary registration delay occurred.");
      showResult(message);
    }finally{
      setButtonBusy(false);
    }
  }

  function ensureRegisterUi(){
    var copy = uiCopy();
    var note = $("registerPaceNote");
    var actions = document.querySelector("#sendOrderBtnSequential")
      ? document.querySelector("#sendOrderBtnSequential").closest(".actions")
      : null;
    var legacy = $("sendOrderBtn") || $("youtubeRegisterBtn");
    if(!actions && legacy) actions = legacy.closest(".actions") || legacy.parentNode;
    if(!actions) return;

    if(note){
      note.textContent = copy.paceNote;
    }else{
      note = document.createElement("p");
      note.className = "serviceNote";
      note.id = "registerPaceNote";
      note.textContent = copy.paceNote;
      actions.parentNode.insertBefore(note, actions);
    }

    if($("sendOrderBtnSequential") && $("sendOrderBtnSimultaneous")){
      $("sendOrderBtnSequential").textContent = copy.sequential;
      $("sendOrderBtnSimultaneous").textContent = copy.simultaneous;
      return;
    }

    actions.innerHTML = "";
    var seq = document.createElement("button");
    seq.className = "btn humateckOnlyButton";
    seq.type = "button";
    seq.id = "sendOrderBtnSequential";
    seq.textContent = copy.sequential;
    var sim = document.createElement("button");
    sim.className = "btn humateckOnlyButton";
    sim.type = "button";
    sim.id = "sendOrderBtnSimultaneous";
    sim.textContent = copy.simultaneous;
    actions.appendChild(seq);
    actions.appendChild(sim);
  }

  window.HumateckYouTubeRegister = {
    deliver: deliver,
    parse: chooseLocalizations
  };

  document.addEventListener("DOMContentLoaded", ensureRegisterUi);
  if(document.readyState !== "loading") ensureRegisterUi();

  document.addEventListener("click", function(event){
    var btn = event.target.closest(
      "#sendOrderBtnSequential, #sendOrderBtnSimultaneous, #sendOrderBtn, #youtubeRegisterBtn"
    );
    if(!btn) return;
    event.preventDefault();
    var mode = btn.id === "sendOrderBtnSimultaneous" ? "simultaneous" : "sequential";
    deliver(mode);
  }, true);
})();
