/**
 * Standalone plan-scope country preview.
 * Does NOT modify youtube-register.js or the order form core script.
 * Only listens to #orderPlanSelect and shows a read-only country list dialog.
 */
(function () {
  var GLOBAL70 = [
    "1. en | English (US/UK/Australia, etc.)",
    "2. hi | Hindi (India)",
    "3. pt | Portuguese (Brazil)",
    "4. id | Indonesian",
    "5. es-419 | Spanish (Latin America)",
    "6. ja | Japanese",
    "7. ru | Russian",
    "8. de | German",
    "9. tr | Turkish",
    "10. ko | Korean",
    "11. fr | French",
    "12. vi | Vietnamese",
    "13. th | Thai",
    "14. fil | Filipino",
    "15. ar | Arabic (Middle East/North Africa)",
    "16. it | Italian",
    "17. ms | Malay",
    "18. zh-TW | Chinese (Taiwan)",
    "19. uk | Ukrainian",
    "20. pl | Polish",
    "21. nl | Dutch",
    "22. es | Spanish (Spain)",
    "23. sv | Swedish",
    "24. ro | Romanian",
    "25. cs | Czech",
    "26. hu | Hungarian",
    "27. el | Greek",
    "28. zh-HK | Chinese (Hong Kong)",
    "29. ur | Urdu (Pakistan)",
    "30. bn | Bengali (Bangladesh)",
    "31. pt-PT | Portuguese (Portugal)",
    "32. fa | Persian (Iran)",
    "33. iw | Hebrew (Israel)",
    "34. sw | Swahili (East Africa)",
    "35. am | Amharic (Ethiopia)",
    "36. af | Afrikaans (South Africa)",
    "37. ta | Tamil (India/Sri Lanka)",
    "38. te | Telugu (India)",
    "39. mr | Marathi (India)",
    "40. my | Burmese (Myanmar)",
    "41. km | Khmer (Cambodia)",
    "42. ne | Nepali",
    "43. lo | Lao (Laos)",
    "44. gu | Gujarati (India)",
    "45. kn | Kannada (India)",
    "46. ml | Malayalam (India)",
    "47. pa | Punjabi (India/Pakistan)",
    "48. no | Norwegian",
    "49. da | Danish",
    "50. fi | Finnish",
    "51. sk | Slovak",
    "52. bg | Bulgarian",
    "53. hr | Croatian",
    "54. sr | Serbian",
    "55. lt | Lithuanian",
    "56. lv | Latvian",
    "57. et | Estonian",
    "58. az | Azerbaijani",
    "59. ka | Georgian",
    "60. be | Belarusian",
    "61. bs | Bosnian",
    "62. mk | Macedonian",
    "63. sq | Albanian",
    "64. fr-CA | French (Canada)",
    "65. es-US | Spanish (US)",
    "66. sr-Latn | Serbian (Latin)",
    "67. ca | Catalan",
    "68. eu | Basque",
    "69. gl | Galician",
    "70. zh-CN | Chinese (Mainland China)",
  ];

  var LISTS = {
    free7_standard: GLOBAL70.slice(0, 5),
    free7: GLOBAL70.slice(0, 5),
    global16: GLOBAL70.slice(0, 16),
    global50: GLOBAL70.slice(0, 50),
    global70: GLOBAL70.slice(),
    /* Subscription / payment aliases → same promised country sets */
    custom50: GLOBAL70.slice(0, 50),
    monthly30: GLOBAL70.slice(0, 30),
    monthly50: GLOBAL70.slice(0, 50),
    monthly70: GLOBAL70.slice(),
    yearly70: GLOBAL70.slice(),
    monthly_standard: GLOBAL70.slice(),
    yearly_standard: GLOBAL70.slice(),
    monthly_premium: GLOBAL70.slice(),
    yearly_premium: GLOBAL70.slice(),
    asia30: [
      "1. hi | Hindi (India)",
      "2. id | Indonesian",
      "3. ja | Japanese",
      "4. ko | Korean",
      "5. vi | Vietnamese",
      "6. th | Thai",
      "7. fil | Filipino",
      "8. ms | Malay",
      "9. zh-TW | Chinese (Taiwan)",
      "10. zh-HK | Chinese (Hong Kong)",
      "11. ur | Urdu (Pakistan)",
      "12. bn | Bengali (Bangladesh)",
      "13. fa | Persian (Iran)",
      "14. iw | Hebrew (Israel)",
      "15. ar | Arabic (Middle East)",
      "16. ta | Tamil (India/Sri Lanka)",
      "17. te | Telugu (India)",
      "18. mr | Marathi (India)",
      "19. my | Burmese (Myanmar)",
      "20. km | Khmer (Cambodia)",
      "21. ne | Nepali",
      "22. lo | Lao (Laos)",
      "23. gu | Gujarati (India)",
      "24. kn | Kannada (India)",
      "25. ml | Malayalam (India)",
      "26. pa | Punjabi (India/Pakistan)",
      "27. az | Azerbaijani",
      "28. ka | Georgian",
      "29. en | English",
      "30. ru | Russian",
    ],
    europe30: [
      "1. ru | Russian",
      "2. de | German",
      "3. fr | French",
      "4. tr | Turkish",
      "5. it | Italian",
      "6. es | Spanish (Spain)",
      "7. pl | Polish",
      "8. uk | Ukrainian",
      "9. nl | Dutch",
      "10. sv | Swedish",
      "11. ro | Romanian",
      "12. cs | Czech",
      "13. hu | Hungarian",
      "14. el | Greek",
      "15. pt-PT | Portuguese (Portugal)",
      "16. no | Norwegian",
      "17. da | Danish",
      "18. fi | Finnish",
      "19. sk | Slovak",
      "20. bg | Bulgarian",
      "21. hr | Croatian",
      "22. sr | Serbian",
      "23. lt | Lithuanian",
      "24. lv | Latvian",
      "25. et | Estonian",
      "26. be | Belarusian",
      "27. bs | Bosnian",
      "28. mk | Macedonian",
      "29. sq | Albanian",
      "30. ka | Georgian",
    ],
    africa30: [
      "1. ar | Arabic (Egypt/North Africa)",
      "2. en | English (Nigeria/Ghana/Kenya/South Africa)",
      "3. fr | French (West/Central Africa)",
      "4. sw | Swahili (Kenya/Tanzania)",
      "5. am | Amharic (Ethiopia)",
      "6. af | Afrikaans (South Africa)",
      "7. pt | Portuguese (Angola/Mozambique)",
      "8. hi | Hindi",
      "9. id | Indonesian",
      "10. ja | Japanese",
      "11. ko | Korean",
      "12. vi | Vietnamese",
      "13. th | Thai",
      "14. fil | Filipino",
      "15. ms | Malay",
      "16. zh-TW | Chinese (Taiwan)",
      "17. zh-HK | Chinese (Hong Kong)",
      "18. ur | Urdu (Pakistan)",
      "19. bn | Bengali (Bangladesh)",
      "20. fa | Persian (Iran)",
      "21. iw | Hebrew (Israel)",
      "22. ru | Russian",
      "23. de | German",
      "24. tr | Turkish",
      "25. it | Italian",
      "26. es | Spanish",
      "27. pl | Polish",
      "28. nl | Dutch",
      "29. uk | Ukrainian",
      "30. sv | Swedish",
    ],
    america30: [
      "1. en | English (US/Canada)",
      "2. es-419 | Spanish (Latin America)",
      "3. pt | Portuguese (Brazil)",
      "4. es | Spanish",
      "5. es-US | Spanish (US)",
      "6. fr-CA | French (Canada)",
      "7. hi | Hindi",
      "8. id | Indonesian",
      "9. ja | Japanese",
      "10. ko | Korean",
      "11. vi | Vietnamese",
      "12. th | Thai",
      "13. fil | Filipino",
      "14. ms | Malay",
      "15. zh-TW | Chinese (Taiwan)",
      "16. zh-HK | Chinese (Hong Kong)",
      "17. ur | Urdu (Pakistan)",
      "18. bn | Bengali (Bangladesh)",
      "19. fa | Persian (Iran)",
      "20. iw | Hebrew (Israel)",
      "21. ar | Arabic",
      "22. ru | Russian",
      "23. de | German",
      "24. tr | Turkish",
      "25. fr | French",
      "26. it | Italian",
      "27. nl | Dutch",
      "28. pl | Polish",
      "29. uk | Ukrainian",
      "30. sv | Swedish",
    ],
    oceania30: [
      "1. en | English (Australia/New Zealand/Pacific)",
      "2. fil | Filipino (Pacific Filipino communities)",
      "3. hi | Hindi",
      "4. id | Indonesian",
      "5. ja | Japanese",
      "6. ko | Korean",
      "7. vi | Vietnamese",
      "8. th | Thai",
      "9. ms | Malay",
      "10. zh-TW | Chinese (Taiwan)",
      "11. zh-HK | Chinese (Hong Kong)",
      "12. ur | Urdu (Pakistan)",
      "13. bn | Bengali (Bangladesh)",
      "14. fa | Persian (Iran)",
      "15. iw | Hebrew (Israel)",
      "16. ar | Arabic",
      "17. ru | Russian",
      "18. de | German",
      "19. tr | Turkish",
      "20. fr | French",
      "21. it | Italian",
      "22. es | Spanish",
      "23. nl | Dutch",
      "24. pl | Polish",
      "25. uk | Ukrainian",
      "26. sv | Swedish",
      "27. ro | Romanian",
      "28. cs | Czech",
      "29. hu | Hungarian",
      "30. el | Greek",
    ],
  };

  var TITLES = {
    free7_standard: "Standard · 7-Day Free (5 countries)",
    free7: "Standard · 7-Day Free (5 countries)",
    asia30: "Asia Plan (30 countries)",
    europe30: "Europe Plan (30 countries)",
    africa30: "Africa Plan (30 countries)",
    america30: "Americas Plan (30 countries)",
    oceania30: "Oceania Plan (30 countries)",
    global16: "Global 16 Countries",
    global50: "Global 50 Countries",
    global70: "Global 70 Countries",
  };

  function ensureUi() {
    if (document.getElementById("planScopePreviewStyle")) return;
    var style = document.createElement("style");
    style.id = "planScopePreviewStyle";
    style.textContent =
      "#planScopePreview{display:none;position:fixed;inset:0;z-index:130;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.78)}" +
      "#planScopePreview.open{display:flex}" +
      "#planScopePreview .pspBox{width:640px;max-width:calc(100vw - 36px);max-height:82vh;overflow:auto;border:1px solid rgba(214,176,78,.75);border-radius:18px;background:linear-gradient(180deg,#161e28,#0c1219);padding:24px 22px;box-shadow:0 22px 60px rgba(0,0,0,.55)}" +
      "#planScopePreview h2{margin:0;color:#ffd95a;font-size:24px;font-weight:900;flex:1;min-width:0;padding-right:12px}" +
      "#planScopePreview .pspHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin:0 0 8px}" +
      "#planScopePreview .pspHead .pspClose{margin-top:0;flex:0 0 auto}" +
      "#planScopePreview .pspLead{margin:0 0 14px;color:#e6e0d4;font-size:15px;line-height:1.55}" +
      "#planScopePreview .pspRemain{display:inline-block;margin-left:10px;padding:4px 10px;border:1px solid rgba(255,217,90,.55);border-radius:999px;background:rgba(255,217,90,.12);color:#ffd95a;font-size:14px;font-weight:900;vertical-align:middle;white-space:nowrap}" +
      "#planScopePreview .pspList{margin:0;padding:0;list-style:none;display:grid;gap:8px}" +
      "#planScopePreview .pspList li{padding:10px 12px;border:1px solid rgba(214,176,78,.28);border-radius:10px;background:rgba(255,255,255,.03);color:#f4f1e8;font-size:15px;line-height:1.45}" +
      "#planScopePreview .pspClose{display:inline-flex;margin-top:18px;min-height:44px;padding:10px 18px;border:2px solid #d9b256;border-radius:12px;background:linear-gradient(180deg,#5c4315,#15110a);color:#fff;font-size:16px;font-weight:900;cursor:pointer}";
    document.head.appendChild(style);

    var wrap = document.createElement("div");
    wrap.id = "planScopePreview";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.innerHTML =
      '<div class="pspBox">' +
      '<div class="pspHead"><h2 id="pspTitle">Selected plan countries</h2>' +
      '<button type="button" class="pspClose" id="pspCloseTop">Close</button></div>' +
      '<p class="pspLead" id="pspLead"></p>' +
      '<ul class="pspList" id="pspList"></ul>' +
      '<button type="button" class="pspClose" id="pspClose">Close</button>' +
      "</div>";
    document.body.appendChild(wrap);

    wrap.addEventListener("click", function (e) {
      if (e.target === wrap || e.target.id === "pspClose" || e.target.id === "pspCloseTop") closePreview();
    });
  }

  function isFreePlan(plan) {
    return plan === "free7_standard" || plan === "free7";
  }

  function getFreeRemainingLabel() {
    var endMs = 0;
    try {
      endMs = parseInt(localStorage.getItem("humateckFreeOnlyTrialEndMs") || "0", 10) || 0;
    } catch (e) {
      endMs = 0;
    }
    if (!endMs) {
      return "Free remaining: 7 days (not started)";
    }
    var leftMs = endMs - Date.now();
    if (leftMs <= 0) {
      return "Free remaining: expired";
    }
    var dayMs = 24 * 60 * 60 * 1000;
    var days = Math.ceil(leftMs / dayMs);
    if (days < 1) days = 1;
    return "Free remaining: " + days + (days === 1 ? " day" : " days");
  }

  function closePreview() {
    var el = document.getElementById("planScopePreview");
    if (el) el.classList.remove("open");
  }

  function openPreview(plan) {
    if (!plan) return;
    ensureUi();
    var rows = LISTS[plan];
    if (!rows || !rows.length) return;
    document.getElementById("pspTitle").textContent = TITLES[plan] || plan;
    var lead = "This distribution scope is applied. Countries (" + rows.length + "):";
    if (isFreePlan(plan)) {
      lead +=
        ' <span class="pspRemain">' +
        getFreeRemainingLabel().replace(/</g, "&lt;") +
        "</span>";
      document.getElementById("pspLead").innerHTML = lead;
    } else {
      document.getElementById("pspLead").textContent = lead;
    }
    document.getElementById("pspList").innerHTML = rows
      .map(function (line) {
        return "<li>" + line.replace(/</g, "&lt;") + "</li>";
      })
      .join("");
    document.getElementById("planScopePreview").classList.add("open");
  }

  function parseLineCode(line) {
    var m = String(line || "").match(/^\s*\d+\.\s*([a-zA-Z0-9-]+)\s*\|/);
    return m ? m[1] : "";
  }

  function resolvePlanId() {
    var sel = document.getElementById("orderPlanSelect");
    if (sel && String(sel.value || "").trim()) return String(sel.value).trim();
    var hidden = document.getElementById("humateckActivePlanValue");
    if (hidden && String(hidden.value || "").trim()) return String(hidden.value).trim();
    try {
      var stored = localStorage.getItem("humateckSelectedPlan") || "";
      if (String(stored).trim()) return String(stored).trim();
    } catch (e) {}
    return "";
  }

  function getLines(plan) {
    var key = plan || resolvePlanId();
    return key && LISTS[key] ? LISTS[key].slice() : [];
  }

  function getCodes(plan) {
    return getLines(plan)
      .map(parseLineCode)
      .filter(Boolean);
  }

  function getTitle(plan) {
    var key = plan || resolvePlanId();
    return TITLES[key] || key || "";
  }

  function lineForCode(code, plan) {
    var rows = getLines(plan);
    var i;
    for (i = 0; i < rows.length; i++) {
      if (parseLineCode(rows[i]) === code) return rows[i];
    }
    for (i = 0; i < GLOBAL70.length; i++) {
      if (parseLineCode(GLOBAL70[i]) === code) return GLOBAL70[i];
    }
    return code + " | " + code;
  }

  /** Distribution Result panel — lists registered success countries (code | name) */
  function refreshSelectedCountriesPanel(successCodes) {
    var listEl = document.getElementById("selectedCountriesList");
    var leadEl = document.getElementById("selectedCountriesLead");
    var headingEl = document.getElementById("selectedCountriesHeading");
    var successEl = document.getElementById("selectedCountriesSuccess");
    if (!listEl) return;

    var plan = resolvePlanId();
    var title = getTitle(plan);
    var codes = (successCodes || [])
      .map(function (c) {
        return String(c || "").trim();
      })
      .filter(Boolean);

    if (headingEl) {
      headingEl.textContent = "Registered success countries";
    }

    if (!codes.length) {
      var promised = getLines(plan);
      if (leadEl) {
        leadEl.textContent = promised.length
          ? "Waiting for distribution. Promised scope (" +
            promised.length +
            ")" +
            (title ? " · " + title : "") +
            " will be compared here after registration."
          : "After distribution finishes, successfully registered country codes appear here.";
      }
      listEl.innerHTML = promised
        .map(function (line) {
          return "<li>" + String(line).replace(/</g, "&lt;") + "</li>";
        })
        .join("");
      if (successEl) {
        successEl.hidden = true;
        successEl.textContent = "";
      }
      return;
    }

    var planCodes = getCodes(plan);
    var ordered = planCodes.length
      ? planCodes.filter(function (c) {
          return codes.indexOf(c) >= 0;
        }).concat(
          codes.filter(function (c) {
            return planCodes.indexOf(c) < 0;
          })
        )
      : codes.slice();

    if (leadEl) {
      leadEl.textContent =
        "Registration succeeded for " +
        ordered.length +
        " language(s)" +
        (title ? " · " + title : "") +
        ". Compare with YouTube Studio.";
    }

    listEl.innerHTML = ordered
      .map(function (code, idx) {
        var line = lineForCode(code, plan);
        var safe = String(line).replace(/</g, "&lt;");
        return (
          '<li class="isRegistered" data-code="' +
          String(code).replace(/"/g, "") +
          '">' +
          (idx + 1) +
          ". " +
          safe +
          ' <span class="regMark">registered</span></li>'
        );
      })
      .join("");

    if (successEl) {
      successEl.hidden = false;
      successEl.textContent = "Registered country codes: " + ordered.join(", ");
    }
  }

  window.HumateckPlanScope = {
    LISTS: LISTS,
    TITLES: TITLES,
    GLOBAL70: GLOBAL70,
    resolvePlanId: resolvePlanId,
    getLines: getLines,
    getCodes: getCodes,
    getTitle: getTitle,
    refreshSelectedCountriesPanel: refreshSelectedCountriesPanel,
  };

  function bind() {
    var sel = document.getElementById("orderPlanSelect");
    if (!sel || sel.__planScopePreviewBound) return;
    sel.__planScopePreviewBound = true;
    sel.addEventListener("change", function () {
      openPreview(sel.value || "");
      refreshSelectedCountriesPanel();
    });
    refreshSelectedCountriesPanel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
