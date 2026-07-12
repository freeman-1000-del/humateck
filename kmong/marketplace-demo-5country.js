(function () {
  "use strict";

  var MAX = 5;
  var BLOCK_CODES = { ko: true };

  var isKo =
    (document.documentElement.lang || "").toLowerCase().indexOf("ko") === 0;

  var T = {
    planDisabled: isKo ? "데모에서는 사용할 수 없습니다" : "Not available in this demo",
    korea: isKo
      ? "데모에서는 한국(ko)을 선택할 수 없습니다."
      : "Korea (ko) is not available in this demo.",
    max: isKo
      ? "데모에서는 국가를 5개까지 선택할 수 있습니다."
      : "You can select up to 5 countries in this demo.",
    pickBtn: isKo
      ? "국가 직접 선택 (데모 · 최대 5개, 한국 제외)"
      : "Pick countries manually (demo · up to 5, Korea excluded)",
    modalTitle: isKo ? "국가 선택 (데모 · 최대 5개)" : "Select up to 5 countries (demo)",
    count: function (n) {
      return isKo ? n + " / 5개 선택" : n + " / 5 selected";
    },
  };

  function injectStyles() {
    if (document.getElementById("humateckDemo5Styles")) return;
    var style = document.createElement("style");
    style.id = "humateckDemo5Styles";
    style.textContent =
      ".planOption.humateck-plan-disabled{opacity:.38!important;pointer-events:none!important;cursor:not-allowed!important;filter:grayscale(.25)}" +
      ".planOption.humateck-plan-disabled .planTooltip{display:none!important}" +
      ".nativeCodeItem.humateck-demo-blocked{opacity:.32!important;filter:grayscale(.35)}" +
      ".nativeCodeItem.humateck-demo-blocked button{pointer-events:none!important;cursor:not-allowed!important;opacity:.55!important}" +
      ".nativeCodeItem.humateck-demo-korea-block{opacity:.28!important}";
    document.head.appendChild(style);
  }

  function isKoreaItem(item) {
    var code = (item.dataset.code || "").toLowerCase();
    if (BLOCK_CODES[code]) return true;
    var text = item.querySelector(".nativeCodeText");
    if (!text) return false;
    var s = text.textContent || "";
    return /Korean|한국/.test(s);
  }

  function patchPlanMenu() {
    var options = document.querySelectorAll(".planOption");
    if (!options.length) return false;
    options.forEach(function (el) {
      var plan = el.getAttribute("data-subscription-plan");
      if (plan === "custom50") {
        el.classList.remove("humateck-plan-disabled");
        el.removeAttribute("aria-disabled");
        var tip = el.querySelector(".planTooltip");
        if (tip) {
          tip.textContent = isKo
            ? "데모: 70개국 목록에서 최대 5개 선택 (한국 제외)"
            : "Demo: pick up to 5 from the 70-country list (Korea excluded)";
        }
      } else {
        el.classList.add("humateck-plan-disabled");
        el.setAttribute("aria-disabled", "true");
        el.setAttribute("title", T.planDisabled);
      }
    });
    var custom = document.querySelector(
      '.planOption[data-subscription-plan="custom50"]'
    );
    if (custom && !custom.classList.contains("selectedOption")) {
      custom.click();
    }
    var pickBtn = document.getElementById("openCustom50PickerBtn");
    if (pickBtn) pickBtn.textContent = T.pickBtn;
    var pickRow = document.getElementById("custom50PickRow");
    if (pickRow) pickRow.hidden = false;
    return true;
  }

  function updateCountLabels(n) {
    var note = document.getElementById("custom50ModalCount");
    if (note) note.textContent = T.count(n);
    var rowNote = document.getElementById("custom50CountNote");
    if (rowNote) rowNote.textContent = T.count(n);
  }

  function refreshGridState() {
    var grid = document.getElementById("custom50Grid");
    if (!grid) return;
    var selected = grid.querySelectorAll(".nativeCodeItem.selected").length;
    updateCountLabels(selected);
    grid.querySelectorAll(".nativeCodeItem").forEach(function (item) {
      item.classList.remove("humateck-demo-blocked", "humateck-demo-korea-block");
      if (isKoreaItem(item)) {
        item.classList.add("humateck-demo-blocked", "humateck-demo-korea-block");
        return;
      }
      if (!item.classList.contains("selected") && selected >= MAX) {
        item.classList.add("humateck-demo-blocked");
      }
    });
    var modal = document.getElementById("custom50Modal");
    if (modal) {
      var h2 = modal.querySelector(".nativeCodeModalHeader h2");
      if (h2) h2.textContent = T.modalTitle;
    }
  }

  function wireGrid() {
    var grid = document.getElementById("custom50Grid");
    if (!grid || grid.getAttribute("data-humateck-demo5") === "1") return;
    grid.setAttribute("data-humateck-demo5", "1");
    grid.addEventListener(
      "click",
      function (e) {
        var btn = e.target.closest("button");
        if (!btn || !grid.contains(btn)) return;
        var item = btn.closest(".nativeCodeItem");
        if (!item) return;
        if (isKoreaItem(item)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          alert(T.korea);
          return;
        }
        var selected = grid.querySelectorAll(".nativeCodeItem.selected").length;
        var willSelect = !item.classList.contains("selected");
        if (willSelect && selected >= MAX) {
          e.preventDefault();
          e.stopImmediatePropagation();
          alert(T.max);
          return;
        }
        setTimeout(refreshGridState, 0);
      },
      true
    );
    var observer = new MutationObserver(function () {
      refreshGridState();
    });
    observer.observe(grid, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    refreshGridState();
  }

  function patchDirectLimit() {
    if (typeof window.getHumateckDirectCountryLimit === "function") {
      var orig = window.getHumateckDirectCountryLimit;
      window.getHumateckDirectCountryLimit = function () {
        var n = orig.apply(this, arguments);
        if (window.__HUMATECK_MARKETPLACE_DEMO_5__) return Math.min(n || MAX, MAX);
        return n;
      };
    }
  }

  function run() {
    injectStyles();
    patchPlanMenu();
    wireGrid();
    refreshGridState();
    patchDirectLimit();
  }

  window.__HUMATECK_MARKETPLACE_DEMO_5__ = true;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
  setTimeout(run, 300);
  setTimeout(run, 900);
  setTimeout(run, 1800);
})();
