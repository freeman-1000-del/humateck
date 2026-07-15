/**
 * Humateck membership + login badge
 * Free: signup modal → Free Login
 * Paid: PayPal first (no pre-login); after PayPal email is known → Paid Login
 */
(function (global) {
  var FREE_PLANS = { free7: true, free7_standard: true };

  var PLAN_LABELS = {
    free7_standard: "Standard · 7-Day Free",
    free7: "Standard · 7-Day Free",
    monthly_standard: "Standard · USD 33 / month",
    yearly_standard: "Standard Annual · USD 316.80 / year",
    monthly_premium: "Enterprise 5-seat · USD 91 / month",
    yearly_premium: "Enterprise Annual · USD 873.60 / year",
  };

  function isFreePlan(plan) {
    return !!FREE_PLANS[plan];
  }

  function getMemberEmail() {
    try {
      return (
        localStorage.getItem("humateckPaidEmail") ||
        localStorage.getItem("humateckMemberEmail") ||
        localStorage.getItem("humateckUserEmail") ||
        localStorage.getItem("humateckEmail") ||
        localStorage.getItem("humateckFreeTrialEmail") ||
        ""
      ).trim();
    } catch (e) {
      return "";
    }
  }

  function getLoginType() {
    try {
      var t = localStorage.getItem("humateckLoginType") || "";
      if (t === "paid" || t === "free") return t;
      if (localStorage.getItem("humateckPaidEmail")) return "paid";
      if (
        localStorage.getItem("humateckFreeTrialEmail") ||
        localStorage.getItem("humateckFreeOnlyTrialActive") === "true"
      )
        return "free";
      if (getMemberEmail()) return "free";
      return "";
    } catch (e) {
      return "";
    }
  }

  function hasMembership() {
    return !!getMemberEmail();
  }

  function hasFreeMembership() {
    return getLoginType() === "free" && !!getMemberEmail();
  }

  function ensureLoginStyles() {
    if (document.getElementById("humateckLoginBadgeStyle")) return;
    var style = document.createElement("style");
    style.id = "humateckLoginBadgeStyle";
    style.textContent =
      "#humateckLoginBadge{display:none;align-items:center;gap:8px;margin-left:auto;padding:8px 14px;border:1px solid rgba(214,176,78,.65);border-radius:999px;background:rgba(214,176,78,.12);color:#ffd95a;font-size:14px;font-weight:800;max-width:min(420px,70vw);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      "#humateckLoginBadge.show{display:inline-flex}" +
      "#humateckLoginBadge.paid{border-color:rgba(103,168,255,.7);background:rgba(75,151,255,.14);color:#9ec5ff}" +
      "#humateckLoginBadge .lbType{flex:0 0 auto}" +
      "#humateckLoginBadge .lbEmail{opacity:.95;font-weight:700;overflow:hidden;text-overflow:ellipsis}";
    document.head.appendChild(style);
  }

  function refreshLoginBadge() {
    ensureLoginStyles();
    var type = getLoginType();
    var email = getMemberEmail();
    var badge = document.getElementById("humateckLoginBadge");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "humateckLoginBadge";
      badge.innerHTML =
        '<span class="lbType"></span><span class="lbEmail"></span>';
      var host =
        document.querySelector(".orderTopButtons") ||
        document.querySelector(".top-left-tools") ||
        document.querySelector(".top");
      if (host) host.appendChild(badge);
      else return;
    }
    if (!type || !email) {
      badge.classList.remove("show", "paid");
      return;
    }
    badge.classList.add("show");
    badge.classList.toggle("paid", type === "paid");
    badge.querySelector(".lbType").textContent =
      type === "paid" ? "Paid Login" : "Free Login";
    badge.querySelector(".lbEmail").textContent = "· " + email;
    badge.title = (type === "paid" ? "Paid Login" : "Free Login") + ": " + email;
  }

  function setFreeLogin(email, plan) {
    var startMs = Date.now();
    var endMs = startMs + 7 * 24 * 60 * 60 * 1000;
    email = (email || "").trim();
    try {
      localStorage.setItem("humateckLoginType", "free");
      localStorage.setItem("humateckMemberEmail", email);
      localStorage.setItem("humateckUserEmail", email);
      localStorage.setItem("humateckEmail", email);
      localStorage.setItem("humateckFreeTrialEmail", email);
      localStorage.setItem("humateckFreeOnlyTrialActive", "true");
      localStorage.setItem("humateckFreeOnlyTrialStartMs", String(startMs));
      localStorage.setItem("humateckFreeOnlyTrialEndMs", String(endMs));
      if (plan) {
        localStorage.setItem("humateckMemberPlan", plan);
        localStorage.setItem("humateckSelectedPlan", plan);
        localStorage.setItem("humateckFreeOnlyActivePlan", plan);
        localStorage.setItem("humateckFreeOnlySubscriberPlan", plan);
      }
      localStorage.setItem("humateckMemberAt", String(startMs));
    } catch (e) {}
    refreshLoginBadge();
  }

  function setPaidLogin(email, plan) {
    email = (email || "").trim();
    if (!email) return;
    try {
      localStorage.setItem("humateckLoginType", "paid");
      localStorage.setItem("humateckPaidEmail", email);
      localStorage.setItem("humateckUserEmail", email);
      localStorage.setItem("humateckEmail", email);
      localStorage.setItem("humateckMemberEmail", email);
      if (plan) {
        localStorage.setItem("humateckMemberPlan", plan);
        localStorage.setItem("humateckSelectedPlan", plan);
      }
    } catch (e) {}
    refreshLoginBadge();
  }

  function saveMembership(email, name, plan) {
    try {
      if (name) localStorage.setItem("humateckMemberName", name);
    } catch (e) {}
    if (isFreePlan(plan)) setFreeLogin(email, plan);
    else setPaidLogin(email, plan);
    global.humateckPaymentSubscriptionPlan = plan || "";
  }

  function ensureStyles() {
    if (document.getElementById("humateckMemberGateStyle")) return;
    var style = document.createElement("style");
    style.id = "humateckMemberGateStyle";
    style.textContent =
      "#humateckMemberGate{display:none;position:fixed;inset:0;z-index:120;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.78)}" +
      "#humateckMemberGate.open{display:flex}" +
      "#humateckMemberGate .mgBox{width:520px;max-width:calc(100vw - 36px);border:1px solid rgba(214,176,78,.75);border-radius:20px;background:linear-gradient(180deg,#161e28,#0c1219);padding:28px 26px;box-shadow:0 22px 60px rgba(0,0,0,.55)}" +
      "#humateckMemberGate h2{margin:0 0 8px;color:#ffd95a;font-size:26px;font-weight:900}" +
      "#humateckMemberGate .mgLead{margin:0 0 18px;color:#e6e0d4;font-size:16px;line-height:1.65}" +
      "#humateckMemberGate .mgPlan{margin:0 0 18px;padding:10px 14px;border:1px solid rgba(214,176,78,.45);border-radius:12px;background:rgba(255,217,90,.08);color:#ffd95a;font-weight:800}" +
      "#humateckMemberGate label{display:block;color:#ffd95a;font-weight:800;margin:0 0 6px}" +
      "#humateckMemberGate input{width:100%;box-sizing:border-box;padding:14px;margin:0 0 14px;border:1px solid #4b5d6d;border-radius:12px;background:#edf4ff;color:#050b14;font-size:17px}" +
      "#humateckMemberGate .mgActions{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}" +
      "#humateckMemberGate .mgBtn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 20px;border:2px solid #d9b256;border-radius:12px;background:linear-gradient(180deg,#5c4315,#15110a);color:#fff;font-size:17px;font-weight:900;cursor:pointer}" +
      "#humateckMemberGate .mgBtn.ghost{background:transparent;color:#e8d8a8}" +
      "#humateckMemberGate .mgNote{margin:12px 0 0;color:#cfc8b9;font-size:14px;line-height:1.55}" +
      "#humateckMemberGate .mgErr{display:none;margin:0 0 12px;color:#ff8d7d;font-weight:800}";
    document.head.appendChild(style);
  }

  function ensureModal() {
    ensureStyles();
    var el = document.getElementById("humateckMemberGate");
    if (el) return el;
    el = document.createElement("div");
    el.id = "humateckMemberGate";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.innerHTML =
      '<div class="mgBox">' +
      '<h2 id="mgTitle">Free Plan Sign-up</h2>' +
      '<p class="mgLead" id="mgLead">Create your free account with email. Then Free Login appears on every page.</p>' +
      '<div class="mgPlan" id="mgPlanLabel"></div>' +
      '<p class="mgErr" id="mgErr"></p>' +
      '<label for="mgEmail">Email</label>' +
      '<input id="mgEmail" type="email" autocomplete="email" placeholder="your@email.com">' +
      '<label for="mgName" id="mgNameLabel">Name (optional)</label>' +
      '<input id="mgName" type="text" autocomplete="name" placeholder="Your name">' +
      '<div class="mgActions">' +
      '<button type="button" class="mgBtn" id="mgContinue">Continue</button>' +
      '<button type="button" class="mgBtn ghost" id="mgCancel">Cancel</button>' +
      "</div>" +
      '<p class="mgNote" id="mgNote"></p>' +
      "</div>";
    document.body.appendChild(el);
    return el;
  }

  var pending = null;

  function closeGate() {
    var el = document.getElementById("humateckMemberGate");
    if (el) el.classList.remove("open");
    pending = null;
  }

  function openMemberGate(opts) {
    opts = opts || {};
    var plan = opts.plan || "";
    if (plan === "free7_enterprise") plan = "free7_standard";
    if (plan === "free7") plan = "free7_standard";
    var mode = opts.mode || (isFreePlan(plan) ? "free" : "paidBind");

    function finish(already) {
      var email = getMemberEmail();
      if (typeof opts.onReady === "function") {
        opts.onReady({ email: email, plan: plan, alreadyMember: !!already });
        return;
      }
      global.location.href = "/?plan=" + encodeURIComponent(plan || "free7_standard");
    }

    if (mode === "free" && hasFreeMembership()) {
      try {
        localStorage.setItem("humateckSelectedPlan", plan || "");
      } catch (e) {}
      finish(true);
      return;
    }

    if (mode === "paidBind" && getLoginType() === "paid" && getMemberEmail()) {
      if (typeof opts.onReady === "function") {
        opts.onReady({ email: getMemberEmail(), plan: plan, alreadyMember: true });
      }
      return;
    }

    var el = ensureModal();
    pending = {
      plan: plan,
      mode: mode,
      onReady: opts.onReady || null,
    };

    document.getElementById("mgTitle").textContent =
      mode === "paidBind" ? "Paid Login" : "Free Plan Sign-up";
    document.getElementById("mgLead").textContent =
      mode === "paidBind"
        ? "Enter the email address you used on PayPal. It will show as Paid Login on every page."
        : "Create your free account with email. Then Free Login appears on every page.";
    document.getElementById("mgPlanLabel").textContent =
      opts.planLabel || PLAN_LABELS[plan] || plan || "Selected plan";
    document.getElementById("mgPlanLabel").style.display = plan ? "" : "none";
    document.getElementById("mgErr").style.display = "none";
    document.getElementById("mgEmail").value = "";
    document.getElementById("mgName").value = "";
    document.getElementById("mgName").style.display =
      mode === "paidBind" ? "none" : "";
    document.getElementById("mgNameLabel").style.display =
      mode === "paidBind" ? "none" : "";
    document.getElementById("mgNote").textContent =
      mode === "paidBind"
        ? "Use the same email as your PayPal subscription."
        : "Next: open the free-trial order form.";

    el.classList.add("open");
    setTimeout(function () {
      var input = document.getElementById("mgEmail");
      if (input) input.focus();
    }, 30);
  }

  function continueFromGate() {
    if (!pending) return;
    var email = (document.getElementById("mgEmail").value || "").trim();
    var name = (document.getElementById("mgName").value || "").trim();
    var err = document.getElementById("mgErr");
    if (!email || email.indexOf("@") < 1) {
      err.textContent = "Please enter a valid email address.";
      err.style.display = "block";
      return;
    }

    var plan = pending.plan;
    var mode = pending.mode;
    var onReady = pending.onReady;

    if (mode === "paidBind") setPaidLogin(email, plan);
    else saveMembership(email, name, plan || "free7_standard");

    closeGate();

    if (typeof onReady === "function") {
      onReady({ email: email, plan: plan, alreadyMember: false });
      return;
    }

    if (mode === "paidBind") {
      global.location.href = "/";
      return;
    }
    global.location.href = "/?plan=" + encodeURIComponent(plan || "free7_standard");
  }

  function handlePayPalReturn() {
    try {
      var params = new URLSearchParams(global.location.search || "");
      var paidReturn =
        params.get("paid") === "1" ||
        params.get("paypal") === "success" ||
        params.get("paypal") === "return" ||
        !!params.get("ba_token") ||
        !!params.get("subscription_id");
      if (!paidReturn) return;
      var plan =
        params.get("plan") ||
        localStorage.getItem("humateckSelectedPlan") ||
        "";
      if (getLoginType() === "paid" && getMemberEmail()) {
        refreshLoginBadge();
        return;
      }
      openMemberGate({
        mode: "paidBind",
        plan: plan,
        planLabel: PLAN_LABELS[plan] || "PayPal subscription",
        onReady: function () {
          refreshLoginBadge();
        },
      });
    } catch (e) {}
  }

  function bindOnce() {
    if (global.__humateckMemberGateBound) return;
    global.__humateckMemberGateBound = true;
    document.addEventListener("click", function (e) {
      if (e.target && e.target.id === "mgContinue") {
        e.preventDefault();
        continueFromGate();
      }
      if (e.target && e.target.id === "mgCancel") {
        e.preventDefault();
        closeGate();
      }
      if (e.target && e.target.id === "humateckMemberGate") {
        closeGate();
      }
    });
    function boot() {
      refreshLoginBadge();
      handlePayPalReturn();
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }

  bindOnce();

  global.HumateckMemberGate = {
    open: openMemberGate,
    close: closeGate,
    hasMembership: hasMembership,
    hasFreeMembership: hasFreeMembership,
    getEmail: getMemberEmail,
    getLoginType: getLoginType,
    isFreePlan: isFreePlan,
    planLabel: function (plan) {
      return PLAN_LABELS[plan] || plan || "";
    },
    saveMembership: saveMembership,
    setFreeLogin: setFreeLogin,
    setPaidLogin: setPaidLogin,
    refreshLoginBadge: refreshLoginBadge,
  };
})(typeof window !== "undefined" ? window : globalThis);
