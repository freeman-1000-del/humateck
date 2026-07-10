(function () {
  "use strict";

  var cfg = window.HUMATECK_PRICING;
  if (!cfg) return;

  var lang =
    document.documentElement.lang === "en" ||
    /-en\.html$|buy-en|deployer-en/.test(location.pathname || "")
      ? "en"
      : "ko";

  function launchActive() {
    return typeof cfg.isLaunchActive === "function" ? cfg.isLaunchActive() : false;
  }

  function formatKrw(amount) {
    if (lang === "en") return "₩" + amount.toLocaleString("en-US");
    if (amount >= 10000 && amount % 10000 === 0) return amount / 10000 + "만원";
    if (amount >= 10000 && amount % 1000 === 0)
      return (amount / 10000).toFixed(1).replace(/\.0$/, "") + "만원";
    return amount.toLocaleString("ko-KR") + "원";
  }

  function offPct(listKrw, saleKrw) {
    if (!listKrw || saleKrw >= listKrw) return 0;
    return Math.round((1 - saleKrw / listKrw) * 100);
  }

  function t(plan, key) {
    return plan[key + (lang === "en" ? "En" : "Ko")] || "";
  }

  function durationLabel(d) {
    return lang === "en" ? d.labelEn : d.labelKo;
  }

  function injectStyles() {
    if (document.getElementById("humateckPricingStyles")) return;
    var style = document.createElement("style");
    style.id = "humateckPricingStyles";
    style.textContent =
      ".heroHook{margin:8px 0 4px;color:#fff;font-size:17px;font-weight:700;line-height:1.55}" +
      ".heroHook .hookPlan{color:#9fd4ff;font-weight:800}" +
      ".heroHook s{color:#8a9199;font-weight:600}" +
      ".heroHook .price{color:#ffd95a;font-weight:900}" +
      ".heroHook .entNote{color:#cfe8ff;font-size:14px;font-weight:600}" +
      ".heroPromoRow{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px 14px;margin:0 0 12px}" +
      ".heroPromoHeadline{margin:0;color:#ffd95a;font-size:18px;font-weight:900;line-height:1.35}" +
      ".heroPromoHeadline .heroPct{display:inline-block;padding:2px 8px;border-radius:999px;background:rgba(255,77,77,.22);border:1px solid rgba(255,120,120,.45);color:#fff}" +
      ".webBuyHero .launchRibbon{margin:0}" +
      ".tierPrices{display:flex;flex-direction:column;gap:10px;margin:0 0 16px}" +
      ".tierRow{display:flex;align-items:baseline;flex-wrap:wrap;gap:8px 10px;padding:12px 14px;border-radius:14px;background:rgba(0,0,0,.28);border:1px solid rgba(214,176,78,.4)}" +
      ".tierRow--hero{border-color:rgba(255,217,90,.65);box-shadow:0 0 18px rgba(255,217,90,.1)}" +
      ".tierLabel{min-width:4.2em;color:#cfe8ff;font-size:14px;font-weight:800}" +
      ".priceOff{padding:3px 9px;border-radius:999px;background:rgba(255,77,77,.18);border:1px solid rgba(255,120,120,.45);color:#ff9b9b;font-size:12px;font-weight:900}" +
      ".priceList{margin:0;color:#8a9199;font-size:16px;font-weight:700;text-decoration:line-through}" +
      ".priceSale{margin:0;color:#9fd4ff;font-size:24px;font-weight:900;line-height:1.1}" +
      ".webBuyHero .heroHook{font-size:16px}" +
      ".webBuyHero .priceSale{font-size:20px}" +
      ".webBuyHero .tierRow{padding:10px 12px}";
    document.head.appendChild(style);
  }

  function setBadge(el) {
    if (!el) return;
    if (!launchActive()) {
      el.hidden = true;
      el.style.display = "none";
      return;
    }
    el.hidden = false;
    el.style.display = "";
    el.textContent = lang === "en" ? cfg.badge.launchEn : cfg.badge.launchKo;
  }

  function setHeroPromo(launch) {
    var row = document.getElementById("heroPromoRow");
    var promo = document.getElementById("heroPromoHeadline");
    if (!promo) return;
    if (!launch) {
      if (row) row.hidden = true;
      promo.hidden = true;
      return;
    }
    if (row) row.hidden = false;
    promo.hidden = false;
    promo.innerHTML = lang === "en" ? cfg.heroPromoEn : cfg.heroPromoKo;
  }

  function buildHeroHook(deluxe, premium, launch) {
    var d = cfg.priceForOption(deluxe, "permanent", launch);
    var p = cfg.priceForOption(premium, "permanent", launch);
    if (!d || !p) return "";
    if (launch && d.saleKrw < d.listKrw) {
      return (
        '<p class="heroHook" id="heroPricingHook">' +
        '<span class="hookPlan">DELUXE</span> <s>' +
        formatKrw(d.listKrw) +
        '</s> <span class="price">' +
        formatKrw(d.saleKrw) +
        '</span> · <span class="hookPlan">PREMIUM</span> <s>' +
        formatKrw(p.listKrw) +
        '</s> <span class="price">' +
        formatKrw(p.saleKrw) +
        '</span> <span class="entNote">' +
        (lang === "en" ? "(5 seats)" : "(5인용)") +
        "</span></p>"
      );
    }
    return (
      '<p class="heroHook" id="heroPricingHook">' +
      '<span class="hookPlan">DELUXE</span> <span class="price">' +
      formatKrw(d.listKrw) +
      '</span> · <span class="hookPlan">PREMIUM</span> <span class="price">' +
      formatKrw(p.listKrw) +
      '</span> <span class="entNote">' +
      (lang === "en" ? "(5 seats)" : "(5인용)") +
      "</span></p>"
    );
  }

  function buildPlanTiers(plan, launch) {
    return (
      '<div class="tierPrices">' +
      cfg.durations
        .map(function (d, i) {
          var p = cfg.priceForOption(plan, d.id, launch);
          if (!p) return "";
          var pct = launch ? offPct(p.listKrw, p.saleKrw) : 0;
          var rowCls = "tierRow" + (d.id === "permanent" ? " tierRow--hero" : "");
          var off =
            pct > 0
              ? '<span class="priceOff">' + pct + "% OFF</span>"
              : "";
          var list =
            pct > 0
              ? '<p class="priceList">' + formatKrw(p.listKrw) + "</p>"
              : "";
          var sale = formatKrw(pct > 0 ? p.saleKrw : p.listKrw);
          return (
            '<div class="' +
            rowCls +
            '"><span class="tierLabel">' +
            durationLabel(d) +
            "</span>" +
            off +
            list +
            '<p class="priceSale">' +
            sale +
            "</p></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function applyBuyPage() {
    var launch = launchActive();
    setBadge(document.getElementById("pricingLaunchBadge"));

    document.querySelectorAll("[data-humateck-plan]").forEach(function (card) {
      var id = card.getAttribute("data-humateck-plan");
      var plan = cfg.plans[id];
      if (!plan) return;
      var tableHost = card.querySelector("[data-humateck-price-table]");
      var tierEl = card.querySelector(".planTier");
      var nameEl = card.querySelector(".planName");
      var tagEl = card.querySelector(".planTagline");
      var descEl = card.querySelector(".planDesc");
      var btnEl = card.querySelector(".planBuyBtn");

      if (nameEl) nameEl.textContent = t(plan, "name");
      if (tierEl) tierEl.textContent = t(plan, "tier");
      /* planTagline · planDesc: buy.html 원문 유지 */
      if (tableHost) tableHost.innerHTML = buildPlanTiers(plan, launch);
      if (btnEl) {
        var subj = t(plan, "mailSubject") + (lang === "en" ? " inquiry" : " 구매 문의");
        btnEl.href = "mailto:support@humateck.com?subject=" + encodeURIComponent(subj);
      }
    });
  }

  function applyHero() {
    var launch = launchActive();
    var deluxe = cfg.plans.deluxe;
    var premium = cfg.plans.premium;
    setBadge(document.getElementById("heroPricingBadge"));
    setHeroPromo(launch);

    var hookHost = document.getElementById("heroPricingHookHost");
    if (hookHost && deluxe && premium) {
      hookHost.innerHTML = buildHeroHook(deluxe, premium, launch);
    }

    var btnEl = document.querySelector(".webBuyHeroBtn");
    if (btnEl) {
      btnEl.textContent = lang === "en" ? cfg.heroMoreEn : cfg.heroMoreKo;
      btnEl.href = lang === "en" ? cfg.buyPath.en : cfg.buyPath.ko;
      if (btnEl.closest(".webBuyHero")) btnEl.setAttribute("target", "_top");
    }
  }

  function run() {
    injectStyles();
    applyBuyPage();
    applyHero();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
