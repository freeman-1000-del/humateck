/*
[Humateck Developer Warning]
This file is the ONLY YouTube registration delivery line.
Allowed: use the Google OAuth result and deliver the customer-approved text to YouTube API.
Forbidden: review, block, judge, pre-validate, modify, auto-correct, add metadata logic, add hidden/admin/test menus, or create self-made registration errors.
Humateck is a delivery system. Google handles authentication. YouTube handles registration response.
Do not move this logic back into order.html.

Failover principle:
- Primary delivery path: localizations-only update. (구글 API 보안 변경으로 인해 사용 중단, 백업 경로로 통합)
- Backup delivery path: snippet + localizations update using the existing YouTube snippet.
- The backup path is not a reviewer. It only retries the same customer-approved delivery with a safer YouTube request shape.
*/
(function(){
  "use strict";

  function $(id){ return document.getElementById(id); }

  var COUNTRY_ORDER_70 = [
    "en","ja","ko","zh-CN","zh-TW","es","es-419","es-US","pt","pt-PT",
    "fr","fr-CA","de","it","ru","hi","ar","id","tr","vi",
    "th","fil","ms","nl","pl","uk","sv","no","da","fi",
    "el","ro","hu","cs","sk","bg","hr","sr","sr-Latn","sq",
    "mk","et","lv","lt","iw","fa","ur","bn","ta","te",
    "mr","gu","kn","ml","pa","ne","sw","af","am","az",
    "be","bs","ca","eu","gl","hy","ka","kk","km","lo"
  ];

  function showResult(message){
    var box = $("deliveryLog");
    if(box){
      box.value = message;
      box.scrollTop = box.scrollHeight;
    }
  }

  function setButtonBusy(isBusy){
    var btn = $("sendOrderBtn") || $("youtubeRegisterBtn");
    if(!btn) return;
    btn.disabled = !!isBusy;
    btn.textContent = isBusy ? "Registration in Progress" : "YouTube Multilingual Registration";
  }

  function getValue(ids){
    for(var i=0;i<ids.length;i++){
      var el = $(ids[i]);
      if(el && typeof el.value === "string" && el.value.trim()) return el.value.trim();
    }
    return "";
  }

  function getAccessToken(){
    if(window.humateckGoogleAccessToken) return window.humateckGoogleAccessToken;
    try{
      var saved = sessionStorage.getItem("humateckGoogleAccessToken");
      if(saved) return saved;
    }catch(e){}
    return getValue(["googleAccessToken","accessToken","oauthAccessToken","authToken"]);
  }

  function getVideoUrl(){ return getValue(["videoUrl", "sourceVideoUrl", "youtubeUrl"]); }
  function getFinalText(){ return getValue(["finalOutput", "finalText", "finalResultText"]); }
  function getNativeLanguageCode(){ return getValue(["nativeLanguageCode"]) || "en"; }
  function getNativeTitle(){ return getValue(["sourceTitle"]); }
  function getNativeDescription(){ return getValue(["sourceDescription"]); }

  function extractVideoId(value){
    var raw = String(value || "").trim();
    if(!raw) return "";
    if(/^[a-zA-Z0-9_-]{8,}$/.test(raw) && raw.indexOf("http") !== 0) return raw;
    try{
      var u = new URL(raw);
      if(u.hostname.indexOf("youtu.be") >= 0) return u.pathname.replace(/^\//, "").split("/").trim();
      var v = u.searchParams.get("v");
      if(v) return v.trim();
      var parts = u.pathname.split("/").filter(Boolean);
      var idx = parts.indexOf("shorts");
      if(idx >= 0 && parts[idx + 1]) return parts[idx + 1].trim();
      idx = parts.indexOf("live");
      if(idx >= 0 && parts[idx + 1]) return parts[idx + 1].trim();
    }catch(e){}
    return raw;
  }

  function clean(v){ return String(v || "").replace(/^\s+|\s+$/g, ""); }
  function stripNumberAndCountryName(text){
    return String(text || "")
      .replace(/^\s*Number\s*:\s*.*$/gmi, "")
      .replace(/^\s*Country\s*Name\s*:\s*.*$/gmi, "");
  }

  function parseLabeledCountryCode(finalText){
    var text = stripNumberAndCountryName(String(finalText || "").replace(/\r/g, "")).trim();
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

  function chooseLocalizations(finalText){
    var first = parseLabeledCountryCode(finalText);
    if(Object.keys(first).length) return first;
    var second = parseCodeLineBlocks(finalText);
    if(Object.keys(second).length) return second;
    return parseSequentialTitleDescription(finalText);
  }

  async function youtubeJson(url, options){
    var res = await fetch(url, options || {});
    var data = await res.json().catch(function(){ return {}; });
    if(!res.ok){
      var msg = data && data.error && data.error.message ? data.error.message : "Temporary YouTube registration response was not accepted.";
      throw new Error(msg);
    }
    return data;
  }

  async function engineSnippetMerge(ctx){
    var existing = await youtubeJson(
      "https://googleapis.com" + encodeURIComponent(ctx.videoId),
      { headers: { Authorization: "Bearer " + ctx.token } }
    );
    
    var video = existing.items && existing.items[0] ? existing.items[0] : {};
    var snippet = video.snippet || {};
    var mergedLocalizations = Object.assign({}, video.localizations || {}, ctx.localizations || {});
    
    var bodyData = {
      id: ctx.videoId,
      snippet: {
        title: getNativeTitle() || snippet.title || "",
        description: getNativeDescription() || snippet.description || "",
        categoryId: snippet.categoryId || "22",
        defaultLanguage: getNativeLanguageCode() || snippet.defaultLanguage || "en"
      },
      localizations: mergedLocalizations
    };

    await youtubeJson("https://googleapis.com", {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + ctx.token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyData)
    });
  }

  async function startYouTubeRegistration(){
    var token = getAccessToken();
    var videoUrl = getVideoUrl();
    var finalText = getFinalText();
    var videoId = extractVideoId(videoUrl);

    if(!token){ showResult("Error: 구글 로그인 인증 토큰이 없습니다."); return; }
    if(!videoId){ showResult("Error: 올바른 유튜브 영상 주소를 입력해 주세요."); return; }
    if(!finalText){ showResult("Error: 등록할 번역 결과 텍스트가 비어 있습니다."); return; }

    setButtonBusy(true);
    showResult("유튜브 다국어 정보 전송 준비 중...");

    try {
      var parsedLocalizations = chooseLocalizations(finalText);
      var totalCountries = Object.keys(parsedLocalizations).length;

      if(totalCountries === 0){
        throw new Error("텍스트에서 국가별 자막 데이터를 파싱하지 못했습니다. 형식을 확인하세요.");
      }

      showResult("총 " + totalCountries + "개국 데이터 전송을 시작합니다...");

      var ctx = {
        token: token,
        videoId: videoId,
        localizations: parsedLocalizations
      };

      await engineSnippetMerge(ctx);
      
      showResult("🎉 성공: 총 " + totalCountries + "개국 다국어 번역 콘텐츠가 채널에 정상적으로 고속 등록되었습니다!");
    } catch(e) {
      showResult("❌ 오류 발생: " + e.message);
    } finally {
      setButtonBusy(false);
    }
  }

  // 즉시 이벤트 바인딩 처리 (웹페이지 구조에 맞게 둘 다 감지)
  function init(){
    var btn = $("sendOrderBtn") || $("youtubeRegisterBtn");
    if(btn){
      btn.addEventListener("click", startYouTubeRegistration);
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }

})();
