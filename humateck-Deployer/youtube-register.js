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


  function parseFinalTextToLocalizations(finalText){
    var normalized = String(finalText || "").replace(/\r/g, "");
    var blocks = normalized.split("Country Code:").slice(1);
    var localizations = {};

    blocks.forEach(function(raw){
      var block = raw.replace(/^\s+/, "");
      var firstBreak = block.indexOf("\n");
      var code = (firstBreak >= 0 ? block.slice(0, firstBreak) : block).trim();
      var rest = firstBreak >= 0 ? block.slice(firstBreak + 1) : "";
      if(!code) return;

      var title = "";
      var description = "";
      var titleMatch = rest.match(/(?:^|\n)Title:\s*(.*)/);
      if(titleMatch) title = titleMatch[1].trim();

      var descIndex = rest.indexOf("Description:");
      if(descIndex >= 0){
        description = rest.slice(descIndex + "Description:".length).replace(/^\n/, "").trimEnd();
      }

      localizations[code] = { title: title, description: description };
    });

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
    if(btn){ btn.disabled = true; btn.textContent = "Registration in Progress"; }

    var startTime = Date.now();
    showResult("register multilingual content is in progress.");

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
        "Registration Results\n" +
        "Number of target registration languages: " + codes.length + " languages\n" +
        "Registration time: " + seconds + " seconds"
      );
      alert("register multilingual content has been completed.");
    }catch(error){
      var message = error && error.message ? error.message : String(error);
      showResult(message);
      alert(message);
    }finally{
      if(btn){ btn.disabled = false; btn.textContent = "YouTube Multilingual Registration"; }
    }
  }

  document.addEventListener("click", function(event){
    var btn = event.target.closest("#sendOrderBtn, #youtubeRegisterBtn");
    if(!btn) return;
    event.preventDefault();
    deliverByYouTubeSpec();
  }, true);
})();
