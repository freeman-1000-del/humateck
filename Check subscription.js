// api/check-subscription.js
// Humateck 구독 상태 확인 API (Vercel Serverless Function)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const SUPABASE_URL = "https://agxxpcgxgggkcdqvwmvg.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_cmn9eVnnvaAjXVJWa6bRQA_qrb1xglQ";

  const email =
    req.query.email ||
    req.cookies?.humateckUserEmail ||
    req.cookies?.humateckEmail ||
    "";

  if (!email) {
    return res.status(200).json({ active: false, reason: "no_email" });
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/subscribers?email=eq.${encodeURIComponent(email)}&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return res.status(200).json({ active: false, reason: "db_error" });
    }

    const rows = await response.json();
    const row = rows && rows[0];

    if (!row) {
      return res.status(200).json({ active: false, reason: "not_found" });
    }

    const now = new Date();
    const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
    const isExpired = expiresAt ? expiresAt < now : false;
    const isActive = row.status === "active" && !isExpired;

    return res.status(200).json({
      active: isActive,
      status: isExpired ? "expired" : row.status,
      plan: row.plan_type,
      plan_type: row.plan_type,
      subscription_plan: row.plan_type,
      country_limit: row.country_limit,
      expires_at: row.expires_at || null,
      started_at: row.started_at || null,
    });
  } catch (e) {
    return res.status(200).json({ active: false, reason: "exception" });
  }
}