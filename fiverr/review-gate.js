(function () {
  "use strict";

  var cfg = window.HUMATECK_REVIEW_GATE;
  if (!cfg) return;

  var validUntil = new Date(cfg.validUntil).getTime();
  var isKo = cfg.lang === "ko";

  var T = {
    title: isKo ? "크몽 상품 심사용 데모" : "Fiverr product review demo",
    badge: isKo ? "심사 전용 · 제한 공개" : "Reviewer access only · Limited release",
    lead: isKo
      ? "이 페이지는 마켓플레이스 심사를 위해 별도로 개설한 데모입니다. 일반 공개 쇼핑몰·웹서비스가 아닙니다."
      : "This page is a dedicated demo opened exclusively for marketplace product review. It is not a public storefront or general website.",
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
    foot: isKo ? "Humateck · 심사용 한시 공개" : "Humateck · Temporary review access",
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

  function showDemo() {
    var gate = document.getElementById("reviewGate");
    var frame = document.getElementById("reviewDemoFrame");
    if (gate) gate.hidden = true;
    if (frame) frame.hidden = false;
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
          '<input id="reviewCode" type="password" autocomplete="off" placeholder="••••••••••••" />' +
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
      '<iframe id="reviewDemoFrame" class="reviewDemoFrame" hidden title="Review demo" src="' +
      cfg.embedSrc +
      '"></iframe>';
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
      if ((input.value || "").trim() === cfg.password) {
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
    if (isValidPeriod() && isAuthed()) {
      buildGate();
      showDemo();
      return;
    }
    buildGate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
