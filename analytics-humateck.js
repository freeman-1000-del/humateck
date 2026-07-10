/**
 * Humateck — Google Analytics 4
 * Same GA property as Content Scouter; filter by product = humateck_register
 */
window.HUMATECK_GA_MEASUREMENT_ID = "G-02PN0TZF9M";

(function () {
  var id = String(window.HUMATECK_GA_MEASUREMENT_ID || "").trim();
  if (!id || id.indexOf("G-") !== 0) return;

  var path = window.location.pathname || "/";
  var siteLang = /-en\.html$|\/deployer-en|\/buy-en|\/tutor-en|practice-embed-en/.test(path)
    ? "en"
    : "ko";
  var product = "humateck_register";

  function virtualPagePath() {
    if (window.__HUMATECK_OPEN_PRACTICE__ || document.body.classList.contains("humateck-open-practice")) {
      return "/deployer/practice";
    }
    if (/\/practice-embed(-en)?\.html$/i.test(path)) return "/deployer/practice";
    if (/\/tutor-embed(-en)?\.html$/i.test(path)) return "/deployer/tutor";
    if (/\/deployer(-en)?\.html$/i.test(path)) return "/deployer/shell";
    if (/\/buy(-en)?\.html$/i.test(path)) return "/buy";
    if (/\/plans\.html$/i.test(path)) return "/plans";
    if (/\/tutor(-en)?\.html$/i.test(path)) return "/tutor/shell";
    return path || "/";
  }

  var pagePath = virtualPagePath();

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", id, {
    anonymize_ip: true,
    send_page_view: true,
    page_path: pagePath,
    page_title: document.title || "Humateck",
    site_lang: siteLang,
    product: product,
  });

  window.humateckTrackEvent = function (eventName, params) {
    try {
      gtag(
        "event",
        eventName,
        Object.assign(
          {
            site_lang: siteLang,
            product: product,
            page_path: pagePath,
          },
          params || {}
        )
      );
    } catch (e) {}
  };

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    if (pagePath === "/deployer/practice" || pagePath === "/deployer/tutor") {
      window.humateckTrackEvent("humateck_practice_view", {
        page_title: document.title || "",
      });
    }
  });

  document.addEventListener(
    "click",
    function (e) {
      var planOpt = e.target.closest && e.target.closest(".planOption[data-subscription-plan]");
      if (planOpt) {
        window.humateckTrackEvent("humateck_plan_select", {
          plan_id: planOpt.getAttribute("data-subscription-plan") || "",
          plan_label: planOpt.getAttribute("data-plan-label") || "",
        });
        return;
      }

      if (e.target.closest && e.target.closest("#openCustom50PickerBtn")) {
        window.humateckTrackEvent("humateck_custom50_open", {});
        return;
      }

      if (e.target.closest && e.target.closest("#generateGeminiPrompt")) {
        window.humateckTrackEvent("humateck_gemini_prompt", {});
        return;
      }

      if (e.target.closest && e.target.closest("#oauthStartBtn")) {
        window.humateckTrackEvent("humateck_oauth_start", {});
        return;
      }

      if (e.target.closest && e.target.closest(".webBuyHeroBtn")) {
        window.humateckTrackEvent("humateck_buy_hero_click", {
          link_url: (e.target.closest(".webBuyHeroBtn").getAttribute("href") || "").slice(0, 200),
        });
        return;
      }

      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (href.indexOf("buy") !== -1 || href.indexOf("mailto:support") !== -1) {
        window.humateckTrackEvent("humateck_cta_click", {
          link_url: href.slice(0, 200),
          link_text: (a.textContent || "").trim().slice(0, 80),
        });
      }
    },
    true
  );

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
  document.head.appendChild(s);
})();
