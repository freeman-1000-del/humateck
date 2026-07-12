(function () {
  "use strict";

  function hidePricingAndBuy() {
    if (document.getElementById("humateckProductPureStyles")) return;
    var style = document.createElement("style");
    style.id = "humateckProductPureStyles";
    style.textContent =
      "#webBuyHero,.webBuyHeroBtn,.launchRibbon,#heroPricingBadge,#heroPricingHookHost{display:none!important}" +
      "body.humateck-open-practice .webBuyHero,body.humateck-pure-product .webBuyHero{display:none!important}" +
      ".planHookNote,[data-humateck-price-table],.priceOff,.priceList,.priceSale,.heroHook,.pricingCurrencyNote,.launchBadge{display:none!important}" +
      "a[href*='buy-en'],a[href*='buy.html']{display:none!important}";
    document.head.appendChild(style);
  }

  function softenCopy() {
    var sub = document.querySelector(".orderLeftColumn .card:first-child .subtitle");
    if (sub) {
      sub.textContent =
        "웹 데모 · 번역 흐름 · Google OAuth 연습 · 실제 등록은 PC 본 프로그램에서 수행";
    }

    var note = document.querySelector(".serviceNote");
    if (note) {
      note.innerHTML =
        "<strong>[안내]</strong> 이 페이지는 번역 흐름과 Google OAuth 연습용 데모입니다. " +
        "실제 YouTube 다국어 등록은 서비스와 함께 전달되는 <strong>PC 본 프로그램</strong>에서 수행합니다.";
    }

    var btn = document.getElementById("sendOrderBtn");
    if (btn) {
      btn.title = "실제 등록은 PC 본 프로그램에서 가능합니다";
    }
  }

  function run() {
    hidePricingAndBuy();
    softenCopy();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
  setTimeout(run, 400);
})();
