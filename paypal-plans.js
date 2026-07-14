/**
 * Overseas web subscription — PayPal Billing Plans
 * Fill planId from PayPal Business → Subscriptions → Plans
 * Do NOT reuse old $12/$19/$25 plan IDs.
 */
(function (global) {
  global.HUMATECK_PAYPAL_WEB = {
    currency: "USD",
    standard: {
      id: "monthly_standard",
      label: "Standard",
      seats: 1,
      amountUsd: 33,
      amountKrwNote: 45000,
      planId: "P-8PS57707AL2928019NJLB7NY",
      subscribeUrl: "", // auto-filled below when planId set
    },
    premium: {
      id: "monthly_premium",
      label: "Enterprise 5-seat",
      seats: 5,
      amountUsd: 98,
      amountKrwNote: 135000,
      planId: "", // pending — create after Standard
      subscribeUrl: "",
    },
  };

  var cfg = global.HUMATECK_PAYPAL_WEB;
  ["standard", "premium"].forEach(function (key) {
    var p = cfg[key];
    if (p.planId) {
      p.subscribeUrl =
        "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=" +
        encodeURIComponent(p.planId);
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
