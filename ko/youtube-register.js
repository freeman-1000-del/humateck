/*
[Humateck Developer Warning]
This file is the ONLY YouTube registration delivery line.
Allowed: use the Google OAuth result and deliver the customer-approved text to YouTube API.
Forbidden: review, block, judge, pre-validate, modify, auto-correct, add metadata logic, add hidden/admin/test menus, or create self-made registration errors.
Humateck is a delivery system. Google handles authentication. YouTube handles registration response.
Do not move this logic back into order.html.
*/

/* Humateck_New055 YouTube API spec delivery - customer clean output */
(function(){
  function $(id){ return document.getElementById(id); }

  function showResult(message){
    var box = $("deliveryLog");
    if(box){
      box.value = message;
      box.scrollTop = box.scrollHeight;
    }
  }

  function getAccessToken(){
    if(window.humateckGoogleAccessToken) return window.humateckGoogleAccessToken;
    try{
      var saved = sessionStorage.getItem("humateckGoogleAccessToken");
      if(saved) return saved;
    }catch(e){}
    var token = "";
    var candidates = ["googleAccessToken","accessToken","oauthAccessToken","authToken"];
    for(var i=0;i<candidates.length;i++){
      var el = document.getElementById(candidates[i]);
      if(el && el.value) return el.value.trim();
    }
    return token;
  }


  function getNativeLanguageCode(){
    var el = $("nativeLanguageCode");
    return el && el.value && el.value.trim() ? el.value.trim() : "en";
  }

  function getNativeTitle(){
    var el = $("sourceTitle");
    return el && el.value ? el.value.trim() : "";
  }

  function getNativeDescription(){
    var el = $("sourceDescription");
    return el && el.value ? el.value.trim() : "";
  }

  function getVideoUrl(){
    var ids = ["videoUrl", "sourceVideoUrl", "youtubeUrl"];
    for(var i=0;i<ids.length;i++){
      var el = $(ids[i]);
      if(el && el.value && el.value.trim()) return el.value.trim();
    }
    return "";
  }

  function extractVideoId(url){
    if(!url) return "";
    try{
      var u = new URL(url);
      if(u.hostname.indexOf("youtu.be") >= 0) return u.pathname.replace("/", "").trim();
      if(u.searchParams.get("v")) return u.searchParams.get("v").trim();
      var parts = u.pathname.split("/");
      var idx = parts.indexOf("shorts");
      if(idx >= 0 && parts[idx + 1]) return parts[idx + 1].trim();
    }catch(e){}
    return "";
  }

  function getFinalText(){
    var ids = ["finalOutput", "finalText", "finalResultText"];
    for(var i=0;i<ids.length;i++){
      var el = $(ids[i]);
      if(el && el.value && el.value.trim()) return el.value.trim();
    }
    return "";
  }


  function getCountryCodeOrder(){
    return [
      "en","es","es-419","es-US","pt","pt-PT","fr","fr-CA","de","ja",
      "ko","zh-CN","zh-TW","zh-HK","hi","id","ar","ru","it","tr",
      "vi","th","fil","ms","nl","pl","uk","sv","no","da",
      "fi","el","ro","hu","cs","sk","bg","hr","sr","sr-Latn",
      "sq","mk","et","lv","lt","iw","fa","ur","bn","ta",
      "te","mr","gu","kn","ml","pa","ne","sw","af","am",
      "az","be","bs","ca","eu","gl","hy","ka","kk","km"
    ].slice(0, getActiveCount());
  }

  function parseFinalTextToLocalizations(finalText){
    var normalized = String(finalText || "").replace(/\r/g, "");
    var blocks = normalized.split("Country Code:").slice(1);
    var localizations = {};

    function cleanLine(v){
      return String(v || "").replace(/^\s+|\s+$/g, "");
    }

    blocks.forEach(function(raw){
      var block = raw.replace(/^\s+/, "");
      var lines = block.split("\n");
      var code = cleanLine(lines.shift() || "");
      if(!code) return;

      var title = "";
      var description = "";
      var mode = "";

      for(var i=0;i<lines.length;i++){
        var line = lines[i];
        var trimmed = cleanLine(line);

        if(/^Title\s*:/i.test(trimmed)){
          mode = "title";
          var sameLineTitle = cleanLine(trimmed.replace(/^Title\s*:/i, ""));
          if(sameLineTitle){
            title = sameLineTitle;
          }
          continue;
        }

        if(/^Description\s*:/i.test(trimmed)){
          mode = "description";
          var sameLineDesc = line.replace(/^.*?Description\s*:/i, "");
          if(cleanLine(sameLineDesc)){
            description += sameLineDesc.replace(/^\s+/, "") + "\n";
          }
          continue;
        }

        if(mode === "title"){
          if(!title && trimmed){
            title = trimmed;
          }
          continue;
        }

        if(mode === "description"){
          description += line + "\n";
        }
      }

      localizations[code] = {
        title: title,
        description: description.replace(/\n+$/g, "")
      };
    });

    if(Object.keys(localizations).length === 0){
      var order = getCountryCodeOrder();
      var pattern = /(?:^|
)\s*Title\s*:\s*([^
]*)([\s\S]*?)(?=
\s*Title\s*:|$)/gi;
      var match;
      var index = 0;
      while((match = pattern.exec(normalized)) && index < order.length){
        var title = cleanLine(match[1] || "");
        var body = match[2] || "";
        var desc = "";
        var d = body.search(/
\s*Description\s*:/i);
        if(d >= 0){
          desc = body.slice(d).replace(/^
\s*Description\s*:\s*/i, "").replace(/
+$/g, "");
        }else{
          desc = body.replace(/^
+/, "").replace(/
+$/g, "");
        }
        localizations[order[index]] = { title: title, description: desc };
        index++;
      }
    }

    return localizations;
  }

  async function youtubeJson(url, options){
    var res = await fetch(url, options);
    var data = await res.json().catch(function(){ return {}; });
    if(!res.ok){
      var message = data && data.error && data.error.message ? data.error.message : "YouTube API error";
      throw new Error(message);
    }
    return data;
  }

  async function deliverByYouTubeSpec(){
    var token = getAccessToken();

    var rawVideoUrl = getVideoUrl();
    var videoId = extractVideoId(rawVideoUrl) || rawVideoUrl;


    var nativeCode = getNativeLanguageCode();
    var nativeTitle = getNativeTitle();
    var nativeDescription = getNativeDescription();


    var finalText = getFinalText();

    var localizations = parseFinalTextToLocalizations(finalText);
    var codes = Object.keys(localizations);

    var btn = $("sendOrderBtn") || $("youtubeRegisterBtn");
    if(btn){ btn.disabled = true; btn.textContent = "등록 진행 중"; }

    var startTime = Date.now();
    showResult("유튜브 등록 진행 중입니다.");

    try{
      var existing = await youtubeJson(
        "https://www.googleapis.com/youtube/v3/videos?part=snippet,localizations&id=" + encodeURIComponent(videoId),
        { headers: { Authorization: "Bearer " + token } }
      );

      var video = existing.items && existing.items[0];
      var snippet = video && video.snippet ? video.snippet : {};
      var mergedLocalizations = Object.assign({}, video.localizations || {}, localizations);

      var body = {
        id: videoId,
        snippet: {
          title: getNativeTitle() || snippet.title || "",
          description: getNativeDescription() || snippet.description || "",
          categoryId: snippet.categoryId || "22",
          defaultLanguage: getNativeLanguageCode()
        },
        localizations: mergedLocalizations
      };

      await youtubeJson(
        "https://www.googleapis.com/youtube/v3/videos?part=snippet,localizations",
        {
          method: "PUT",
          headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }
      );

      var seconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      showResult(
        "등록 결과\n" +
        "등록 대상 언어 수: " + codes.length + "개\n" +
        "등록 시간 : " + seconds + "초"
      );
      alert("유튜브 등록이 완료되었습니다.");
    }catch(error){
      var message = error && error.message ? error.message : String(error);
      showResult(message);
      alert(message);
    }finally{
      if(btn){ btn.disabled = false; btn.textContent = "다국어 번역콘텐츠 유튜브 등록"; }
    }
  }

  document.addEventListener("click", function(event){
    var btn = event.target.closest("#sendOrderBtn, #youtubeRegisterBtn");
    if(!btn) return;
    event.preventDefault();
    deliverByYouTubeSpec();
  }, true);
})();
