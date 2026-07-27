/* Native / source language code picker — restored from original order forms. */
(function (global) {
  var CODES_EN = [["af", "Afrikaans"], ["am", "Amharic"], ["ar", "Arabic"], ["as", "Assamese"], ["az", "Azerbaijani"], ["be", "Belarusian"], ["bg", "Bulgarian"], ["bn", "Bengali"], ["bs", "Bosnian"], ["ca", "Catalan"], ["cs", "Czech"], ["da", "Danish"], ["de", "German"], ["el", "Greek"], ["en-GB", "English (UK)"], ["en-IN", "English (India)"], ["en", "English"], ["es", "Spanish"], ["es-419", "Spanish (Latin America)"], ["es-US", "Spanish (US)"], ["et", "Estonian"], ["eu", "Basque"], ["fa", "Persian"], ["fi", "Finnish"], ["fil", "Filipino"], ["fr-CA", "French (Canada)"], ["fr", "French"], ["gl", "Galician"], ["gu", "Gujarati"], ["hi", "Hindi"], ["hr", "Croatian"], ["hu", "Hungarian"], ["hy", "Armenian"], ["id", "Indonesian"], ["is", "Icelandic"], ["it", "Italian"], ["iw", "Hebrew"], ["ja", "Japanese"], ["ka", "Georgian"], ["kk", "Kazakh"], ["km", "Khmer"], ["kn", "Kannada"], ["ko", "Korean"], ["ky", "Kyrgyz"], ["lo", "Lao"], ["lt", "Lithuanian"], ["lv", "Latvian"], ["mk", "Macedonian"], ["ml", "Malayalam"], ["mn", "Mongolian"], ["mr", "Marathi"], ["ms", "Malay"], ["my", "Burmese"], ["no", "Norwegian"], ["ne", "Nepali"], ["nl", "Dutch"], ["or", "Odia"], ["pa", "Punjabi"], ["pl", "Polish"], ["pt", "Portuguese"], ["pt-PT", "Portuguese (Portugal)"], ["ro", "Romanian"], ["ru", "Russian"], ["si", "Sinhala"], ["sk", "Slovak"], ["sl", "Slovenian"], ["sq", "Albanian"], ["sr-Latn", "Serbian (Latin)"], ["sr", "Serbian"], ["sv", "Swedish"], ["sw", "Swahili"], ["ta", "Tamil"], ["te", "Telugu"], ["th", "Thai"], ["tr", "Turkish"], ["uk", "Ukrainian"], ["ur", "Urdu"], ["uz", "Uzbek"], ["vi", "Vietnamese"], ["zh-CN", "Chinese (Mainland)"], ["zh-HK", "Chinese (Hong Kong)"], ["zh-TW", "Chinese (Taiwan)"], ["zu", "Zulu"]];
  var CODES_KO = [["af", "아프리칸스어"], ["am", "암하라어"], ["ar", "아랍어"], ["as", "아삼어"], ["az", "아제르바이잔어"], ["be", "벨라루스어"], ["bg", "불가리아어"], ["bn", "벵골어"], ["bs", "보스니아어"], ["ca", "카탈로니아어"], ["cs", "체코어"], ["da", "덴마크어"], ["de", "독일어"], ["el", "그리스어"], ["en-GB", "영어(영국)"], ["en-IN", "영어(인도)"], ["en", "영어"], ["es", "스페인어"], ["es-419", "스페인어(라틴 아메리카)"], ["es-US", "스페인어(미국)"], ["et", "에스토니아어"], ["eu", "바스크어"], ["fa", "페르시아어"], ["fi", "핀란드어"], ["fil", "필리핀어"], ["fr-CA", "프랑스어(캐나다)"], ["fr", "프랑스어"], ["gl", "갈리시아어"], ["gu", "구자라트어"], ["hi", "힌디어"], ["hr", "크로아티아어"], ["hu", "헝가리어"], ["hy", "아르메니아어"], ["id", "인도네시아어"], ["is", "아이슬란드어"], ["it", "이탈리아어"], ["iw", "히브리어"], ["ja", "일본어"], ["ka", "조지아어"], ["kk", "카자흐어"], ["km", "크메르어"], ["kn", "칸나다어"], ["ko", "한국어"], ["ky", "키르기스어"], ["lo", "라오어"], ["lt", "리투아니아어"], ["lv", "라트비아어"], ["mk", "마케도니아어"], ["ml", "말라얄람어"], ["mn", "몽골어"], ["mr", "마라티어"], ["ms", "말레이어"], ["my", "버마어"], ["no", "노르웨이어"], ["ne", "네팔어"], ["nl", "네덜란드어"], ["or", "오리야어"], ["pa", "펀자브어"], ["pl", "폴란드어"], ["pt", "포르투갈어"], ["pt-PT", "포르투갈어(포르투갈)"], ["ro", "루마니아어"], ["ru", "러시아어"], ["si", "싱할라어"], ["sk", "슬로바키아어"], ["sl", "슬로베니아어"], ["sq", "알바니아어"], ["sr-Latn", "세르비아어(로마자)"], ["sr", "세르비아어"], ["sv", "스웨덴어"], ["sw", "스와힐리어"], ["ta", "타밀어"], ["te", "텔루구어"], ["th", "태국어"], ["tr", "튀르키예어"], ["uk", "우크라이나어"], ["ur", "우르두어"], ["uz", "우즈베크어"], ["vi", "베트남어"], ["zh-CN", "중국어(중국)"], ["zh-HK", "중국어(홍콩)"], ["zh-TW", "중국어(대만)"], ["zu", "줄루어"]];

  function $(id) { return document.getElementById(id); }

  function pinCodeFirst(codes, code) {
    var list = codes.slice();
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i][0] === code) {
        idx = i;
        break;
      }
    }
    if (idx > 0) {
      var item = list.splice(idx, 1)[0];
      list.unshift(item);
    }
    return list;
  }

  function buildGrid(codes, selectLabel) {
    var grid = $("nativeCodeGrid");
    if (!grid) return;
    grid.innerHTML = "";
    codes.forEach(function (pair) {
      var code = pair[0];
      var name = pair[1];
      var item = document.createElement("div");
      item.className = "nativeCodeItem" + (code === "ko" || code === "en" ? " nativeCodeItemPinned" : "");
      item.innerHTML =
        '<div class="nativeCodeText"><strong>' + code + "</strong> | " + name + "</div>" +
        '<button type="button" data-native-code="' + code + '">' + selectLabel + "</button>";
      grid.appendChild(item);
    });
  }

  function openModal() {
    var modal = $("nativeCodeModal");
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    var modal = $("nativeCodeModal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  global.initNativeLanguageCodePicker = function (locale) {
    var isKo = locale === "ko";
    var codes = pinCodeFirst(isKo ? CODES_KO : CODES_EN, isKo ? "ko" : "en");
    buildGrid(codes, isKo ? "선택" : "Select");
    var hint = $("nativeCodePinnedHint");
    if (hint) {
      hint.textContent = isKo ? "한국 : ko" : "English : en";
    }
    document.addEventListener("click", function (event) {
      if (event.target.closest("#openNativeCodeListBtn")) {
        event.preventDefault();
        openModal();
        return;
      }
      if (event.target.closest("#closeNativeCodeListBtn")) {
        event.preventDefault();
        closeModal();
        return;
      }
      var selectBtn = event.target.closest("[data-native-code]");
      if (selectBtn) {
        event.preventDefault();
        var input = $("nativeLanguageCode");
        if (input) {
          input.value = selectBtn.getAttribute("data-native-code") || "";
          input.focus();
        }
        closeModal();
        return;
      }
      var modal = $("nativeCodeModal");
      if (modal && event.target === modal) closeModal();
    });
  };
})(window);
