(function () {
  "use strict";

  var CHECKOUT_URL =
    "https://ajvtyotblrtexcxuazqm.supabase.co/functions/v1/deployer-checkout";
  var VALID_PLANS = {
    asia30: true,
    europe30: true,
    africa30: true,
    america30: true,
    oceania30: true,
    global50: true,
    global70: true,
  };

  function selectedPlan() {
    try {
      var plan = localStorage.getItem("humateckSelectedPlan") || "";
      if (plan === "global16") {
        localStorage.removeItem("humateckSelectedPlan");
        return "";
      }
      return VALID_PLANS[plan] ? plan : "";
    } catch (e) {
      return "";
    }
  }

  function getEmail() {
    try {
      return (
        localStorage.getItem("humateckUserEmail") ||
        localStorage.getItem("humateckEmail") ||
        ""
      );
    } catch (e) {
      return "";
    }
  }

  function saveEmail(email) {
    try {
      localStorage.setItem("humateckUserEmail", email);
      localStorage.setItem("humateckEmail", email);
    } catch (e) {}
  }

  function setStatus(msg) {
    var el = document.getElementById("plansCheckoutStatus");
    if (el) el.textContent = msg || "";
  }

  async function startPayPal(billing) {
    var plan = selectedPlan();
    if (!plan) {
      setStatus("Select a deployment country plan below first.");
      var grid = document.getElementById("planGrid");
      if (grid) grid.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    var email = getEmail().trim().toLowerCase();
    if (!email || email.indexOf("@") < 1) {
      email = (window.prompt("Enter your email for PayPal subscription:") || "")
        .trim()
        .toLowerCase();
    }
    if (!email || email.indexOf("@") < 1) {
      setStatus("A valid email is required for PayPal checkout.");
      return;
    }
    saveEmail(email);

    try {
      localStorage.setItem("humateckSelectedBilling", billing);
    } catch (e) {}

    setStatus("Redirecting to PayPal…");
    var monthlyBtn = document.getElementById("paypalMonthlyBtn");
    var annualBtn = document.getElementById("paypalAnnualBtn");
    if (monthlyBtn) monthlyBtn.disabled = true;
    if (annualBtn) annualBtn.disabled = true;

    try {
      var res = await fetch(CHECKOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan, email: email, billing: billing }),
      });
      var data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok || !data.ok || !data.url) {
        throw new Error((data && data.error) || "Checkout failed");
      }
      window.location.href = data.url;
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Checkout failed");
      if (monthlyBtn) monthlyBtn.disabled = false;
      if (annualBtn) annualBtn.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var monthlyBtn = document.getElementById("paypalMonthlyBtn");
    var annualBtn = document.getElementById("paypalAnnualBtn");
    if (monthlyBtn) {
      monthlyBtn.addEventListener("click", function () {
        void startPayPal("monthly");
      });
    }
    if (annualBtn) {
      annualBtn.addEventListener("click", function () {
        void startPayPal("annual");
      });
    }

    var grid = document.getElementById("planGrid");
    if (grid) {
      grid.addEventListener("click", function (e) {
        var art = e.target.closest("[data-subscription-plan]");
        if (!art) return;
        var id = art.getAttribute("data-subscription-plan");
        if (!id || id === "custom50") {
          setStatus("Custom Selection is not available for PayPal checkout yet.");
          return;
        }
        try {
          localStorage.setItem("humateckSelectedPlan", id);
        } catch (err) {}
        grid.querySelectorAll("[data-subscription-plan]").forEach(function (el) {
          el.style.outline = "";
        });
        art.style.outline = "2px solid #ffd95a";
        setStatus("Selected: " + id);
      });
    }
  });
})();
