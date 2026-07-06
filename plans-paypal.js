(function () {
  "use strict";

  var CHECKOUT_URL =
    "https://ajvtyotblrtexcxuazqm.supabase.co/functions/v1/deployer-checkout";
  /** Same price for every scope — deployment country is chosen on the order page. */
  var DEFAULT_PLAN = "global70";

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
        body: JSON.stringify({
          plan: DEFAULT_PLAN,
          email: email,
          billing: billing,
        }),
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
  });
})();
