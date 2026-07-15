/**
 * Humateck PC license — public pricing only.
 * Launch special may appear on site. Ongoing internal discounts are NEVER exposed here.
 */
(function (global) {
  var LAUNCH_END = "2026-12-31";

  var DURATIONS = [
    { id: "permanent", labelKo: "영구", labelEn: "Lifetime" },
    { id: "months12", labelKo: "12개월", labelEn: "12 months" },
    { id: "months6", labelKo: "6개월", labelEn: "6 months" },
  ];

  var PLANS = {
    deluxe: {
      nameKo: "DELUXE",
      nameEn: "DELUXE",
      tierKo: "일반",
      tierEn: "Standard",
      taglineKo:
        "70개국 분량도 수작업이면 대략 35분 가까이 걸리기 쉽습니다. 등록 자체는 보통 수 초면 끝납니다.",
      taglineEn:
        "Manual work across ~70 countries often takes around 35 minutes. Registration itself usually finishes in a few seconds.",
      descKo: "PC 1대 · 구글 클라이언트 인증가이드(PDF) 제공",
      descEn: "1 PC · Google Client Authentication Guide (PDF) included",
      mailSubjectKo: "DELUXE 일반",
      mailSubjectEn: "DELUXE Standard",
      options: {
        permanent: { listKrw: 720000, saleKrw: 576000, listUsd: 499, saleUsd: 399 },
        months12: { listKrw: 370000, saleKrw: 296000, listUsd: 249, saleUsd: 199 },
        months6: { listKrw: 268000, saleKrw: 214400, listUsd: 179, saleUsd: 149 },
      },
    },
    premium: {
      nameKo: "PREMIUM",
      nameEn: "PREMIUM",
      tierKo: "기업 5인 패키지",
      tierEn: "Enterprise 5-seat pack",
      taglineKo:
        "MCN·에이전시용 5인 패키지. 같은 등록 작업을 최대 5대 PC에서 나눠 쓰고, 반복 복붙 시간을 줄입니다.",
      taglineEn:
        "5-seat pack for MCN and agency teams. Share the same registration flow across up to 5 PCs and cut repetitive copy-paste time.",
      descKo: "PC 5대 (5인용) · 구글 클라이언트 인증가이드(PDF) 제공",
      descEn: "5 PCs (5 seats) · Google Client Authentication Guide (PDF) included",
      mailSubjectKo: "PREMIUM 기업 5인 패키지",
      mailSubjectEn: "PREMIUM Enterprise 5-seat",
      featured: true,
      options: {
        permanent: { listKrw: 1860000, saleKrw: 1488000, listUsd: 1249, saleUsd: 999 },
        months12: { listKrw: 952000, saleKrw: 809200, listUsd: 649, saleUsd: 519 },
        months6: { listKrw: 689000, saleKrw: 586000, listUsd: 469, saleUsd: 379 },
      },
    },
  };

  function isLaunchActive(now) {
    var end = new Date(LAUNCH_END + "T23:59:59+09:00");
    return (now || new Date()) <= end;
  }

  function priceForOption(plan, durationId, launch) {
    var opt = plan.options[durationId];
    if (!opt) return null;
    return {
      listKrw: opt.listKrw,
      saleKrw: launch ? opt.saleKrw : opt.listKrw,
      listUsd: opt.listUsd,
      saleUsd: launch ? opt.saleUsd : opt.listUsd,
    };
  }

  global.HUMATECK_PRICING = {
    launchEnds: LAUNCH_END,
    durations: DURATIONS,
    plans: PLANS,
    isLaunchActive: isLaunchActive,
    priceForOption: priceForOption,
    badge: {
      launchKo: "출시 기념 특가 20% 할인 중!",
      launchEn: "Launch special — 20% off · 3 plan tiers",
    },
    heroBasisKo: "평생판 기준",
    heroBasisEn: "Lifetime",
    heroMoreKo: "가격 상세 보기",
    heroMoreEn: "More pricing info",
    buyPath: { ko: "/buy.html", en: "/buy-en.html" },
    contactPath: { ko: "/contact.html", en: "/contact-en.html" },
    buySubtitleKo: "영구 · 12개월 · 6개월 · 3종 플랜",
    buySubtitleEn: "Lifetime / 12-Month / 6-Month — 3 Pricing Plans",
    /* Ads / CTAs → own-site web Deployer (PayPal). Marketplace listing buttons retired. */
    webCta: {
      ko: {
        label: "웹 주문폼으로 이동",
        url: "/humateck-Deployer/order.html",
      },
      en: {
        label: "Go to order form",
        url: "/humateck-Deployer/order.html",
      },
    },
    /* Own-site web subscription — Standard $33/$316.80 · Enterprise $91/$873.60 */
    webSubscription: {
      standard: {
        seats: 1,
        labelKo: "Standard 1인",
        labelEn: "Standard",
        monthly: { listKrw: 45000, listUsd: 33 },
        yearly: { listKrw: 432000, listUsd: 316.8, discountRate: 0.2 },
      },
      premium: {
        seats: 5,
        labelKo: "Enterprise 5인",
        labelEn: "Enterprise 5-seat",
        monthly: { listKrw: 125000, listUsd: 91 },
        yearly: { listKrw: 1200000, listUsd: 873.6, discountRate: 0.2 },
      },
      noteKo: "자체 웹 PayPal. 월간 $33/$91 · 연간 20% 할인($316.80/$873.60). 재능마켓 PC가보다 싸게 보이게 두지 말 것.",
      noteEn: "Own-site PayPal: $33/$91 monthly · annual 20% off ($316.80/$873.60).",
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
