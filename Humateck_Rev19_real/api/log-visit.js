export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!rawUrl || !serviceRole) {
    return res.status(500).json({
      error: 'Missing Supabase env vars',
      hasUrl: !!rawUrl,
      hasServiceRole: !!serviceRole
    });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const row = {
      source: payload.source || 'unknown',
      page_name: payload.page_name || '',
      event_name: payload.event_name || '',
      detail: payload.detail || '',
      user_agent: payload.user_agent || '',
    };

    const r = await fetch(`${rawUrl}/rest/v1/visitor_logs`, {
      method: 'POST',
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(row)
    });

    const text = await r.text();
    res.setHeader('Content-Type', 'application/json');
    if (!r.ok) return res.status(r.status).send(text || JSON.stringify({ error: 'Insert failed' }));
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}