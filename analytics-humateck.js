/**
 * Humateck — Google Analytics 4 (다국어등록기 속성 G-QEL38T6JXL)
 * GA4 실시간 → 이벤트 이름 "humateck_ping" / "humateck_practice_view" 로 확인
 */
window.HUMATECK_GA_MEASUREMENT_ID = "G-QEL38T6JXL";

(function () {
  if (window.__HUMATECK_GA_READY__) return;

  var id = String(window.HUMATECK_GA_MEASUREMENT_ID || "").trim();
  if (!id || id.indexOf("G-") !== 0) return;

  window.__HUMATECK_GA_READY__ = true;

  var path = window.location.pathname || "/";
  var siteLang = /-en\.html$|\/deployer-en|\/buy-en|\/tutor-en|practice-embed-en/.test(path)
    ? "en"
    : "ko";
  var product = "다국어등록기";

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
  var pageTitle = document.title || "Humateck";

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  function bootConfig() {
    gtag("js", new Date());
    gtag("config", id, {
      anonymize_ip: true,
      send_page_view: true,
      page_path: pagePath,
      page_title: pageTitle,
      page_location: window.location.href,
    });
    gtag("event", "humateck_ping", {
      product: product,
      site_lang: siteLang,
      page_path: pagePath,
      page_title: pageTitle,
      host: window.location.hostname || "",
    });
    if (pagePath === "/deployer/practice" || pagePath === "/deployer/tutor") {
      gtag("event", "humateck_practice_view", {
        product: product,
        site_lang: siteLang,
        page_path: pagePath,
      });
    }
  }

  window.humateckTrackEvent = function (eventName, params) {
    try {
      gtag(
        "event",
        eventName,
        Object.assign(
          {
            product: product,
            site_lang: siteLang,
            page_path: pagePath,
          },
          params || {}
        )
      );
    } catch (e) {}
  };

  window.humateckLoadAnalytics = function () {
    if (window.__HUMATECK_GA_BOOTED__) return;
    window.__HUMATECK_GA_BOOTED__ = true;
    bootConfig();
  };

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  document.addEventListener(
    "click",
    function (e) {
      if (!window.humateckTrackEvent) return;

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
  s.onload = function () {
    window.humateckLoadAnalytics();
  };
  s.onerror = function () {
    window.__HUMATECK_GA_READY__ = false;
  };
  (document.head || document.documentElement).appendChild(s);

  onReady(function () {
    if (window.__HUMATECK_GA_BOOTED__) return;
    if (window.google_tag_manager || (window.dataLayer && window.dataLayer.length > 2)) {
      window.humateckLoadAnalytics();
    }
  });
})();
