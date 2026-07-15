/**
 * Humateck membership gate — email signup before free order or paid PayPal.
 * Free / paid share one modal; next step depends on selected plan.
 */
(function (global) {
  var FREE_PLANS = {
    free7: true,
    free7_standard: true,
  };

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

  function hasMembership() {
    return !!getMemberEmail();
  }

  function saveMembership(email, name, plan) {
    var startMs = Date.now();
    var endMs = startMs + 7 * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem("humateckMemberEmail", email);
      localStorage.setItem("humateckUserEmail", email);
      localStorage.setItem("humateckEmail", email);
      if (name) localStorage.setItem("humateckMemberName", name);
      localStorage.setItem("humateckMemberPlan", plan || "");
      localStorage.setItem("humateckMemberAt", String(startMs));
      localStorage.setItem("humateckSelectedPlan", plan || "");
      if (isFreePlan(plan)) {
        localStorage.setItem("humateckFreeTrialEmail", email);
        localStorage.setItem("humateckFreeOnlyTrialActive", "true");
        localStorage.setItem("humateckFreeOnlyTrialStartMs", String(startMs));
        localStorage.setItem("humateckFreeOnlyTrialEndMs", String(endMs));
        localStorage.setItem("humateckFreeOnlyActivePlan", plan);
        localStorage.setItem("humateckFreeOnlySubscriberPlan", plan);
      }
    } catch (e) {}
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
      "<h2>Create Humateck Account</h2>" +
      '<p class="mgLead">Sign up with your email before continuing. Free and paid plans both require membership first.</p>' +
      '<div class="mgPlan" id="mgPlanLabel"></div>' +
      '<p class="mgErr" id="mgErr"></p>' +
      '<label for="mgEmail">Email</label>' +
      '<input id="mgEmail" type="email" autocomplete="email" placeholder="your@email.com">' +
      '<label for="mgName">Name (optional)</label>' +
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

    function finish(already) {
      var email = getMemberEmail();
      if (typeof opts.onReady === "function") {
        opts.onReady({ email: email, plan: plan, alreadyMember: !!already });
        return;
      }
      var next = opts.next || (isFreePlan(plan) ? "order" : "paypal");
      var paypalUrl = opts.paypalUrl || "";
      if (next === "paypal") {
        if (paypalUrl) global.location.href = paypalUrl;
        else alert("PayPal plan ID is pending. Please try again after plan ID is linked.");
        return;
      }
      global.location.href = "/?plan=" + encodeURIComponent(plan || "free7_standard");
    }

    if (hasMembership()) {
      try {
        localStorage.setItem("humateckSelectedPlan", plan || "");
        localStorage.setItem("humateckMemberPlan", plan || "");
      } catch (e) {}
      global.humateckPaymentSubscriptionPlan = plan || "";
      finish(true);
      return;
    }

    var el = ensureModal();
    pending = {
      plan: plan,
      paypalUrl: opts.paypalUrl || "",
      next: opts.next || (isFreePlan(plan) ? "order" : "paypal"),
      onReady: opts.onReady || null,
    };

    document.getElementById("mgPlanLabel").textContent =
      opts.planLabel || PLAN_LABELS[plan] || plan || "Selected plan";
    document.getElementById("mgErr").style.display = "none";
    document.getElementById("mgEmail").value = "";
    document.getElementById("mgName").value = "";
    document.getElementById("mgNote").textContent = isFreePlan(plan)
      ? "Next: open the order form with your free trial scope."
      : "Next: continue to PayPal subscription checkout.";

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
    var next = pending.next;
    var paypalUrl = pending.paypalUrl;
    var onReady = pending.onReady;

    saveMembership(email, name, plan);
    closeGate();

    if (typeof onReady === "function") {
      onReady({ email: email, plan: plan, alreadyMember: false });
      return;
    }

    if (next === "paypal") {
      if (paypalUrl) {
        global.location.href = paypalUrl;
      } else {
        alert("PayPal plan ID is pending. Membership saved — please try again after plan ID is linked.");
      }
      return;
    }

    global.location.href = "/?plan=" + encodeURIComponent(plan || "free7_standard");
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
  }

  bindOnce();

  global.HumateckMemberGate = {
    open: openMemberGate,
    close: closeGate,
    hasMembership: hasMembership,
    getEmail: getMemberEmail,
    isFreePlan: isFreePlan,
    planLabel: function (plan) {
      return PLAN_LABELS[plan] || plan || "";
    },
    saveMembership: saveMembership,
  };
})(typeof window !== "undefined" ? window : globalThis);
