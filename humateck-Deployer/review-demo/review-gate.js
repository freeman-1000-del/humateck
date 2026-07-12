(function () {
  "use strict";

  var cfg = window.HUMATECK_REVIEW_GATE;
  if (!cfg) return;

  var validUntil = new Date(cfg.validUntil).getTime();
  var isKo = cfg.lang === "ko";

  var T = {
    title: cfg.title || (isKo ? "심사용 등록기" : "Marketplace Review Demo"),
    badge: isKo ? "심사 전용 · 제한 공개" : "Reviewer access only · Limited release",
    lead: isKo
      ? "Humateck Deployer 등록기의 마켓플레이스 심사용 접속입니다. 별도 웹사이트가 아니라 납품 제품의 심사 전용 창구입니다."
      : "Marketplace review access for the Humateck Deployer registration tool. Not a separate website — a reviewer-only entry point for the delivered product.",
    valid: isKo ? "접속 유효기간: " : "Access valid until: ",
    codeLabel: isKo ? "심사용 접속 코드" : "Reviewer access code",
    codeHint: isKo
      ? "제출 자료·메시지에 안내된 코드를 입력하세요."
      : "Enter the access code provided in the submission materials or message.",
    open: isKo ? "데모 열기" : "Open demo",
    bad: isKo ? "접속 코드가 올바르지 않습니다." : "Incorrect access code.",
    expired: isKo
      ? "심사용 데모 유효기간(30일)이 종료되었습니다. support@humateck.com"
      : "This review demo has expired (30-day window). Contact support@humateck.com",
    foot: isKo ? "Humateck Deployer · 심사용 접속" : "Humateck Deployer · Review access",
    loading: isKo
      ? "등록기 불러오는 중… 인터넷 연결에 따라 30초~1분 걸릴 수 있습니다."
      : "Loading registration tool… This may take 30–60 seconds depending on your connection.",
  };

  function isValidPeriod() {
    return Date.now() <= validUntil;
  }

  function isAuthed() {
    try {
      return sessionStorage.getItem(cfg.storageKey) === "1";
    } catch (e) {
      return false;
    }
  }

  function setAuthed() {
    try {
      sessionStorage.setItem(cfg.storageKey, "1");
    } catch (e) {}
  }

  function formatDate() {
    try {
      return new Date(validUntil).toLocaleDateString(isKo ? "ko-KR" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Seoul",
      });
    } catch (e) {
      return "2026-08-12";
    }
  }

  function ensureFrame() {
    var frame = document.getElementById("reviewDemoFrame");
    if (!frame) return null;
    if (!frame.getAttribute("data-src")) {
      frame.setAttribute("data-src", cfg.embedSrc);
    }
    return frame;
  }

  function startEmbedLoad() {
    var frame = ensureFrame();
    var loading = document.getElementById("reviewLoading");
    if (!frame) return;
    if (!frame.src) {
      frame.src = frame.getAttribute("data-src") || cfg.embedSrc;
    }
    if (loading) loading.hidden = false;
    frame.hidden = false;
    frame.onload = function () {
      if (loading) loading.hidden = true;
    };
  }

  function showDemo() {
    var gate = document.getElementById("reviewGate");
    if (gate) gate.hidden = true;
    startEmbedLoad();
  }

  function buildGate() {
    var wrap = document.createElement("div");
    wrap.className = "reviewGateWrap";
    wrap.innerHTML =
      '<div class="reviewGateBox" id="reviewGate">' +
      '<p class="reviewBadge">' +
      T.badge +
      "</p>" +
      "<h1>" +
      T.title +
      "</h1>" +
      '<p class="reviewLead">' +
      T.lead +
      "</p>" +
      '<p class="reviewValid">' +
      T.valid +
      "<strong>" +
      formatDate() +
      "</strong></p>" +
      (isValidPeriod()
        ? '<label for="reviewCode">' +
          T.codeLabel +
          "</label>" +
          '<input id="reviewCode" type="password" autocomplete="off" placeholder="••••" />' +
          '<p class="reviewHint">' +
          T.codeHint +
          "</p>" +
          '<button type="button" id="reviewOpenBtn" class="reviewBtn">' +
          T.open +
          "</button>" +
          '<p class="reviewErr" id="reviewErr" hidden></p>'
        : '<p class="reviewExpired">' + T.expired + "</p>") +
      '<p class="reviewFoot">' +
      T.foot +
      "</p>" +
      "</div>" +
      '<p id="reviewLoading" class="reviewLoading" hidden>' +
      T.loading +
      "</p>" +
      '<iframe id="reviewDemoFrame" class="reviewDemoFrame" hidden title="Review demo"></iframe>';
    document.body.appendChild(wrap);

    if (!isValidPeriod()) return;

    var btn = document.getElementById("reviewOpenBtn");
    var input = document.getElementById("reviewCode");
    var err = document.getElementById("reviewErr");

    function tryOpen() {
      if (!isValidPeriod()) {
        err.textContent = T.expired;
        err.hidden = false;
        return;
      }
      var entered = (input.value || "").trim();
      var expected = String(cfg.password || "").trim();
      if (entered && entered === expected) {
        setAuthed();
        err.hidden = true;
        showDemo();
        return;
      }
      err.textContent = T.bad;
      err.hidden = false;
    }

    btn.addEventListener("click", tryOpen);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") tryOpen();
    });
  }

  function init() {
    buildGate();
    if (isValidPeriod() && isAuthed()) {
      showDemo();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
