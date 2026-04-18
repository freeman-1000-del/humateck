export default async function handler(req, res) {
  const SUPABASE_URL = 'https://ajvytoyblrtecxuazqm.supabase.co';
  const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdnR5b3RibHJ0ZXhjeHVhenFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzcyMjI4NiwiZXhwIjoyMDg5Mjk4Mjg2fQ.lyOT2_O2W3Ef_cN5ehjyAQthCe18a3fTh-HrbjUUb9c';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ error: 'Missing Supabase env vars' });
  }

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/visitor_logs?select=source,page_name,event_name,detail,created_at&order=created_at.desc&limit=100`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
        },
      }
    );

    const text = await r.text();

    res.setHeader('Content-Type', 'application/json');
    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}