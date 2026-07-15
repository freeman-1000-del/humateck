/**
 * Overseas web subscription — PayPal Billing Plans
 * Standard $33/mo · $316.80/yr (20% off)
 * Enterprise 5-seat $91/mo · $873.60/yr (20% off)
 * Do NOT reuse old $12/$19/$25 or former Enterprise $98 plan IDs.
 */
(function (global) {
  var YEARLY_DISCOUNT = 0.2;

  function yearlyFromMonthly(monthlyUsd) {
    return Math.round(monthlyUsd * 12 * (1 - YEARLY_DISCOUNT) * 100) / 100;
  }

  global.HUMATECK_PAYPAL_WEB = {
    currency: "USD",
    yearlyDiscountRate: YEARLY_DISCOUNT,
    standard: {
      id: "monthly_standard",
      label: "Standard",
      seats: 1,
      interval: "month",
      amountUsd: 33,
      amountKrwNote: 45000,
      planId: "P-8PS57707AL2928019NJLB7NY",
      subscribeUrl: "",
    },
    standardYearly: {
      id: "yearly_standard",
      label: "Standard (Annual)",
      seats: 1,
      interval: "year",
      amountUsd: yearlyFromMonthly(33),
      amountKrwNote: 432000,
      planId: "",
      subscribeUrl: "",
    },
    premium: {
      id: "monthly_premium",
      label: "Enterprise 5-seat",
      seats: 5,
      interval: "month",
      amountUsd: 91,
      amountKrwNote: 125000,
      planId: "",
      subscribeUrl: "",
    },
    premiumYearly: {
      id: "yearly_premium",
      label: "Enterprise 5-seat (Annual)",
      seats: 5,
      interval: "year",
      amountUsd: yearlyFromMonthly(91),
      amountKrwNote: 1200000,
      planId: "",
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
