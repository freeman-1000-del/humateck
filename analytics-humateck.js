/**
 * Humateck register / buy shells — Google Analytics 4
 * site_lang: ko (deployer.html, buy.html) | en (deployer-en.html, buy-en.html)
 */
window.HUMATECK_GA_MEASUREMENT_ID = "G-02PN0TZF9M";

(function () {
  var id = String(window.HUMATECK_GA_MEASUREMENT_ID || "").trim();
  if (!id || id.indexOf("G-") !== 0) return;

  var path = window.location.pathname || "";
  var siteLang = /-en\.html$|\/deployer-en|\/buy-en/.test(path) ? "en" : "ko";

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", id, {
    anonymize_ip: true,
    site_lang: siteLang,
    product: "humateck_register",
  });

  window.humateckTrackEvent = function (eventName, params) {
    try {
      gtag(
        "event",
        eventName,
        Object.assign({ site_lang: siteLang, product: "humateck_register" }, params || {})
      );
    } catch (e) {}
  };

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (href.indexOf("buy") !== -1 || href.indexOf("mailto:support") !== -1) {
        window.humateckTrackEvent("register_cta_click", {
          link_url: href,
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
