(function () {
  "use strict";

  var cfg = window.HUMATECK_PRICING;
  if (!cfg) return;

  var lang =
    document.documentElement.getAttribute("lang") === "en" ||
    /(?:^|\/)buy-en(?:\.html)?(?:$|[?#])|(?:^|\/)deployer-en(?:\.html)?(?:$|[?#])|deployer-en\//.test(
      location.pathname || ""
    )
      ? "en"
      : "ko";

  function launchActive() {
    return typeof cfg.isLaunchActive === "function" ? cfg.isLaunchActive() : false;
  }

  function listAmount(p) {
    return lang === "en" ? p.listUsd : p.listKrw;
  }

  function saleAmount(p) {
    return lang === "en" ? p.saleUsd : p.saleKrw;
  }

  function formatPrice(amount) {
    if (lang === "en") return "$" + amount.toLocaleString("en-US");
    if (amount >= 10000) {
      var man = Math.round((amount / 10000) * 10) / 10;
      if (man === Math.floor(man)) return Math.floor(man) + "만원";
      return man.toFixed(1) + "만원";
    }
    return amount.toLocaleString("ko-KR") + "원";
  }

  function offPct(listAmt, saleAmt) {
    if (!listAmt || saleAmt >= listAmt) return 0;
    return Math.round((1 - saleAmt / listAmt) * 100);
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
      ".heroHook .hookBasis{color:#9fd4ff;font-size:15px;font-weight:800}" +
      ".heroHook s{color:#8a9199;font-weight:600}" +
      ".heroHook .price{color:#ffd95a;font-weight:900}" +
      ".heroHook .entNote{color:#cfe8ff;font-size:14px;font-weight:600}" +
      ".heroPromoRow{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px 14px;margin:0 0 12px}" +
      ".heroPromoHeadline{margin:0;color:#ffd95a;font-size:18px;font-weight:900;line-height:1.35}" +
      ".heroPromoHeadline .heroPct{display:inline-block;padding:2px 8px;border-radius:999px;background:rgba(255,77,77,.22);border:1px solid rgba(255,120,120,.45);color:#fff}" +
      ".heroLifetimeNote{margin:6px 0 14px;color:#9aa0a6;font-size:13px;font-weight:600}" +
      ".tierPrices{display:flex;flex-direction:column;gap:10px;margin:0 0 16px}" +
      ".tierRow{display:flex;align-items:baseline;flex-wrap:wrap;gap:8px 10px;padding:12px 14px;border-radius:14px;background:rgba(0,0,0,.28);border:1px solid rgba(214,176,78,.4)}" +
      ".tierRow--hero{border-color:rgba(255,217,90,.65);box-shadow:0 0 18px rgba(255,217,90,.1)}" +
      ".tierLabel{min-width:4.2em;color:#cfe8ff;font-size:14px;font-weight:800}" +
      ".priceOff{padding:3px 9px;border-radius:999px;background:rgba(255,77,77,.18);border:1px solid rgba(255,120,120,.45);color:#ff9b9b;font-size:12px;font-weight:900}" +
      ".priceList{margin:0;color:#8a9199;font-size:16px;font-weight:700;text-decoration:line-through}" +
      ".priceSale{margin:0;color:#9fd4ff;font-size:24px;font-weight:900;line-height:1.1}" +
      ".webBuyHero .heroHook{font-size:16px}" +
      ".webBuyHero .priceSale{font-size:20px}" +
      ".webBuyHero .tierRow{padding:10px 12px}" +
      ".pricingCurrencyNote{margin:0 0 18px;color:#9aa0a6;font-size:13px;font-weight:600;text-align:center}" +
      ".planMarketBtn.is-pending{cursor:default;opacity:.92}" +
      ".launchBadge,.launchRibbon{font-size:18px!important;padding:10px 20px!important;letter-spacing:.02em}";
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

  function heroBasisHtml() {
    var basis = lang === "en" ? cfg.heroBasisEn : cfg.heroBasisKo;
    if (!basis) return "";
    return '<span class="hookBasis">' + basis + "</span> ";
  }

  function buildHeroHook(deluxe, premium, launch) {
    var d = cfg.priceForOption(deluxe, "permanent", launch);
    var p = cfg.priceForOption(premium, "permanent", launch);
    if (!d || !p) return "";
    var prefix = heroBasisHtml();
    var dList = listAmount(d);
    var dSale = saleAmount(d);
    var pList = listAmount(p);
    var pSale = saleAmount(p);
    if (launch && dSale < dList) {
      return (
        '<p class="heroHook" id="heroPricingHook">' +
        prefix +
        '<span class="hookPlan">DELUXE</span> <s>' +
        formatPrice(dList) +
        '</s> <span class="price">' +
        formatPrice(dSale) +
        '</span> · <span class="hookPlan">PREMIUM</span> <s>' +
        formatPrice(pList) +
        '</s> <span class="price">' +
        formatPrice(pSale) +
        '</span> <span class="entNote">' +
        (lang === "en" ? "(5 seats)" : "(5인용)") +
        "</span></p>"
      );
    }
    return (
      '<p class="heroHook" id="heroPricingHook">' +
      prefix +
      '<span class="hookPlan">DELUXE</span> <span class="price">' +
      formatPrice(dList) +
      '</span> · <span class="hookPlan">PREMIUM</span> <span class="price">' +
      formatPrice(pList) +
      '</span> <span class="entNote">' +
      (lang === "en" ? "(5 seats)" : "(5인용)") +
      "</span></p>"
    );
  }

  function buildPlanTiers(plan, launch) {
    return (
      '<div class="tierPrices">' +
      cfg.durations
        .map(function (d) {
          var p = cfg.priceForOption(plan, d.id, launch);
          if (!p) return "";
          var listAmt = listAmount(p);
          var saleAmt = saleAmount(p);
          var pct = launch ? offPct(listAmt, saleAmt) : 0;
          var rowCls = "tierRow" + (d.id === "permanent" ? " tierRow--hero" : "");
          var off =
            pct > 0
              ? '<span class="priceOff">' + pct + "% OFF</span>"
              : "";
          var list =
            pct > 0
              ? '<p class="priceList">' + formatPrice(listAmt) + "</p>"
              : "";
          var sale = formatPrice(pct > 0 ? saleAmt : listAmt);
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

    var currencyNote = document.getElementById("pricingCurrencyNote");
    if (currencyNote) {
      currencyNote.textContent = lang === "en" ? "All prices in USD." : "";
      currencyNote.hidden = lang !== "en";
      currencyNote.style.display = lang === "en" ? "" : "none";
    }

    var subtitleEl = document.querySelector(".hero .subtitle");
    if (subtitleEl) {
      subtitleEl.textContent =
        lang === "en" ? cfg.buySubtitleEn : cfg.buySubtitleKo;
    }

    document.querySelectorAll("[data-humateck-plan]").forEach(function (card) {
      var id = card.getAttribute("data-humateck-plan");
      var plan = cfg.plans[id];
      if (!plan) return;
      var tableHost = card.querySelector("[data-humateck-price-table]");
      var tierEl = card.querySelector(".planTier");
      var nameEl = card.querySelector(".planName");
      var btnEl = card.querySelector(".planMarketBtn");

      if (nameEl) nameEl.textContent = t(plan, "name");
      if (tierEl) tierEl.textContent = t(plan, "tier");
      if (tableHost) tableHost.innerHTML = buildPlanTiers(plan, launch);
      if (btnEl) {
        var cta = (cfg.webCta && (lang === "en" ? cfg.webCta.en : cfg.webCta.ko)) || {
          label: lang === "en" ? "View web subscription plans" : "웹 구독 플랜 보기",
          url: "/humateck-Deployer/plans.html",
        };
        btnEl.textContent = cta.label;
        btnEl.href = cta.url;
        btnEl.removeAttribute("aria-disabled");
        btnEl.classList.remove("is-pending");
        btnEl.removeAttribute("role");
      }
    });
  }

  function applyHero() {
    var launch = launchActive();
    var deluxe = cfg.plans.deluxe;
    var premium = cfg.plans.premium;
    setBadge(document.getElementById("heroPricingBadge"));
    var promoExtra = document.getElementById("heroPromoHeadline");
    if (promoExtra) promoExtra.hidden = true;

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
