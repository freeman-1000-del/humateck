/**
 * Overseas web subscription — PayPal Billing Plans
 * Standard $19.90/mo · $191/yr
 * Enterprise removed.
 */
(function (global) {
  global.HUMATECK_PAYPAL_WEB = {
    currency: "USD",
    yearlyDiscountRate: 0.2,
    standard: {
      id: "monthly_standard",
      label: "Standard",
      seats: 1,
      interval: "month",
      amountUsd: 19.9,
      amountKrwNote: 27000,
      planId: "P-6N573179MC2175529NJR6JAQ",
      subscribeUrl: "",
    },
    standardYearly: {
      id: "yearly_standard",
      label: "Standard (Annual)",
      seats: 1,
      interval: "year",
      amountUsd: 191,
      amountKrwNote: 260000,
      planId: "P-9MA49375486999806NJR6JAQ",
      subscribeUrl: "",
    },
  };

  var cfg = global.HUMATECK_PAYPAL_WEB;
  Object.keys(cfg).forEach(function (key) {
    var p = cfg[key];
    if (!p || typeof p !== "object" || !("planId" in p)) return;
    if (p.planId) {
      p.subscribeUrl =
        "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=" +
        encodeURIComponent(p.planId);
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
