export default async function handler(req, res) {
  const rawUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!rawUrl || !serviceRole) {
    return res.status(500).json({
      error: 'Missing Supabase env vars',
      hasUrl: !!rawUrl,
      hasServiceRole: !!serviceRole
    });
  }

  const apiUrl =
    `${rawUrl}/rest/v1/visitor_logs` +
    `?select=source,page_name,event_name,detail,created_at` +
    `&order=created_at.desc&limit=100`;

  try {
    const r = await fetch(apiUrl, {
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
        Accept: 'application/json'
      }
    });

    const text = await r.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(500).json({
      error: String(e),
      cause: e?.cause?.code || e?.cause?.message || null,
      supabaseUrl: rawUrl,
      hint: 'Check SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY values in Vercel and redeploy.'
    });
  }
}