/*
[Humateck Developer Restored Line]
10개 언어 오더페이지 서식과 70개 언어 범용 로직 간의 ID 매칭을 완벽히 동기화한 버전입니다.
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
    } else {
      // 로그창이 없을 경우 브라우저 콘솔에도 기록을 남겨 먹통 방지
      console.log("[YouTube Register Log]", message);
    }
  }

  function setButtonBusy(isBusy){
    var btn = $("youtubeRegisterBtn") || $("sendOrderBtn");
    if(!btn) return;
    btn.disabled = !!isBusy;
    btn.textContent = isBusy ? "다국어 등록 진행 중..." : "YouTube 다국어 등록 시작";
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
  // 10개 언어 오더창에 설정된 finalOutput을 최우선으로 수집합니다.
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
      if(u.hostname.indexOf("youtu.be") >= 0) return u.pathname.replace(/^\//, "").split("/")[0].trim();
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

  function parseTitleDescription(textBlock){
    var lines = String(textBlock || "").split("\n");
    var title = "";
    var descLines = [];
    var foundDescHeader = false;

    for(var i=0; i<lines.length; i++){
      var line = lines[i];
      if(/^\s*Title\s*:\s*/i.test(line)){
        title = clean(line.replace(/^\s*Title\s*:\s*/i, ""));
        continue;
      }
      if(/^\s*Description\s*:\s*/i.test(line)){
        foundDescHeader = true;
        var firstDescLine = line.replace(/^\s*Description\s*:\s*/i, "");
        if(clean(firstDescLine)){
          descLines.push(clean(firstDescLine));
        }
        continue;
      }
      if(foundDescHeader){
        descLines.push(line);
      } else {
        if(clean(line) && !title){
          title = clean(line);
        }
      }
    }
    return { title: title || "Multilingual Title", description: descLines.join("\n").trim() };
  }

  function chooseLocalizations(finalText){
    var text = stripNumberAndCountryName(String(finalText || "").replace(/\r/g, ""));
    var parts = text.split(/\n\s*Country\s*Code\s*:\s*/i);
    if(parts.length <= 1){
      parts = text.split(/^\s*Country\s*Code\s*:\s*/gmi);
    }
    var localizations = {};
    for(var i=1;i<parts.length;i++){
      var block = parts[i].replace(/^\s+/, "");
      var lines = block.split("\n");
      var code = clean(lines.shift() || "");
      if(!code) continue;
      
      // 70개 규격 외에 10개 코드만 등록되어 있어도 유연하게 수집하도록 보완
      var parsed = parseTitleDescription(lines.join("\n"));
      localizations[code] = { title: parsed.title, description: parsed.description };
    }
    return localizations;
  }

  async function callYouTubeAPI(path, token, body){
    var url = "https://www.googleapis.com/youtube/v3/" + path;
    return fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  }

  async function engineLocalizationsOnly(ctx){
    var body = {
      id: ctx.videoId,
      localizations: ctx.localizations
    };
    var res = await callYouTubeAPI("videos?part=localizations", ctx.token, body);
    if(!res.ok){
      var errText = await res.text();
      throw new Error(errText || "Primary route registration failed.");
    }
    return true;
  }

  async function engineSnippetMerge(ctx){
    var url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + ctx.videoId;
    var getRes = await fetch(url, {
      headers: { "Authorization": "Bearer " + ctx.token }
    });
    if(!getRes.ok) throw new Error("Failed to load original video snippet for failover path.");
    var data = await getRes.json();
    if(!data.items || !data.items[0]) throw new Error("Target video details could not be found on YouTube.");
    
    var currentSnippet = data.items[0].snippet;
    var body = {
      id: ctx.videoId,
      snippet: {
        categoryId: currentSnippet.categoryId,
        defaultLanguage: currentSnippet.defaultLanguage || getNativeLanguageCode(),
        description: currentSnippet.description || getNativeDescription(),
        title: currentSnippet.title || getNativeTitle(),
        tags: currentSnippet.tags || []
      },
      localizations: ctx.localizations
    };
    var res = await callYouTubeAPI("videos?part=snippet,localizations", ctx.token, body);
    if(!res.ok){
      var errData = await res.text();
      throw new Error(errData || "Failover route data sync failed.");
    }
    return true;
  }

  async function deliver(){
    var started = Date.now();
    var token = getAccessToken();
    var videoUrl = getVideoUrl();
    var videoId = extractVideoId(videoUrl);
    var finalText = getFinalText();

    if(!token){
      showResult("오류: 구글 로그인 인증 토큰이 존재하지 않습니다. 구글 로그인을 먼저 진행해 주세요.");
      return;
    }
    if(!videoId){
      showResult("오류: 올바른 YouTube 영상 주소(URL)를 입력창에 적어주세요.");
      return;
    }
    if(!finalText){
      showResult("오류: 등록할 번역 텍스트 결과(finalOutput)가 비어 있습니다.");
      return;
    }

    var localizations = chooseLocalizations(finalText);
    var codes = Object.keys(localizations);
    
    if(codes.length === 0){
      showResult("오류: 텍스트에서 추출된 국가 코드(Country Code)가 없습니다. 서식을 확인하세요.");
      return;
    }

    var ctx = { token: token, videoId: videoId, localizations: localizations };

    setButtonBusy(true);
    showResult("유튜브 다국어 등록을 전송하는 중입니다...");

    try{
      try{
        await engineLocalizationsOnly(ctx);
      }catch(primaryError){
        console.warn("Primary path failed, trying snippet failover...", primaryError);
        await engineSnippetMerge(ctx);
      }
      var seconds = Math.max(1, Math.round((Date.now() - started) / 1000));
      showResult(
        "🎉 유튜브 등록 성공!\n" +
        "■ 등록 완료 국가: " + codes.length + "개 언어 지역\n" +
        "■ 반영 시간: " + seconds + "초 소요"
      );
    }catch(error){
      var message = error && error.message ? error.message : String(error || "알 수 없는 전송 지연 오류가 발생했습니다.");
      showResult("❌ 등록 실패 원인:\n" + message);
    }finally{\n      setButtonBusy(false);\n    }\n  }\n\n  window.HumateckYouTubeRegister = {\n    deliver: deliver,\n    parse: chooseLocalizations\n  };\n\n  // 버튼 클릭 시 정상적으로 가로채 전송(deliver)을 수행하도록 통합 설정\n  document.addEventListener("click", function(event){\n    var btn = event.target.closest("#youtubeRegisterBtn, #sendOrderBtn");\n    if(!btn) return;\n    event.preventDefault();\n    deliver();\n  });\n})();\n
