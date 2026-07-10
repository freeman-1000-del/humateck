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
        "매번 번역문 복붙에 날아가던 소중한 내 시간, 단 한번의 결제로 자동화시키세요.",
      taglineEn:
        "Stop losing hours to copy-paste—automate with one payment.",
      descKo: "PC 1대 · 설치 · 인증 티칭 영상 포함",
      descEn: "1 PC · setup & OAuth tutorial videos included",
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
        "MCN, 글로벌 에이전시 필수품. 직원 5명의 업무효율을 70배 끌어올려줍니다.",
      taglineEn:
        "Essential for MCNs and global agencies—boost a 5-person team’s efficiency by up to 70×.",
      descKo: "PC 5대 (5인용) · 설치 · 인증 티칭 영상 포함",
      descEn: "5 PCs (5 seats) · setup & OAuth tutorial videos included",
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
      launchKo: "출시 기념 특가 20% 할인 3종 플랜!",
      launchEn: "Launch special — 20% off · 3 plan tiers",
    },
    heroBasisKo: "평생판 기준",
    heroBasisEn: "Lifetime",
    heroMoreKo: "가격 상세 보기",
    heroMoreEn: "More pricing info",
    buyPath: { ko: "/buy.html", en: "/buy-en.html" },
  };
})(typeof window !== "undefined" ? window : globalThis);
